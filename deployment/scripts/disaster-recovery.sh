#!/bin/bash

# QuantEnergx Disaster Recovery Script
# This script handles automated failover and disaster recovery

set -euo pipefail

# Configuration
PRIMARY_REGION="us-east-1"
SECONDARY_REGION="eu-west-1"
TERTIARY_REGION="ap-southeast-1"
NAMESPACE="quantenergx"
HEALTH_CHECK_TIMEOUT=30
MAX_RETRIES=3

# Logging
LOG_FILE="/var/log/quantenergx/disaster-recovery.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1" >&2
}

# Health check function
check_health() {
    local endpoint=$1
    local max_attempts=${2:-3}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts for $endpoint"
        
        if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$endpoint/health" > /dev/null; then
            log "Health check successful for $endpoint"
            return 0
        fi
        
        log "Health check failed for $endpoint (attempt $attempt/$max_attempts)"
        ((attempt++))
        sleep 5
    done
    
    return 1
}

# Database failover
failover_database() {
    local primary_db=$1
    local secondary_db=$2
    
    log "Starting database failover from $primary_db to $secondary_db"
    
    # Stop writes to primary
    log "Stopping writes to primary database"
    kubectl exec -n "$NAMESPACE" deployment/quantenergx-backend -- \
        node -e "process.env.DB_READONLY = 'true'; process.kill(process.pid, 'SIGUSR1')" || true
    
    # Wait for replication to catch up
    log "Waiting for replication sync..."
    sleep 10
    
    # Promote secondary to primary
    log "Promoting secondary database to primary"
    aws rds promote-read-replica --db-instance-identifier "$secondary_db" --region "$SECONDARY_REGION"
    
    # Wait for promotion to complete
    log "Waiting for database promotion to complete..."
    aws rds wait db-instance-available --db-instance-identifier "$secondary_db" --region "$SECONDARY_REGION"
    
    # Update connection strings
    log "Updating database connection strings"
    kubectl patch secret quantenergx-secrets -n "$NAMESPACE" \
        --patch="{\"data\":{\"database-url\":\"$(echo "postgresql://user:password@${secondary_db}.region.rds.amazonaws.com:5432/quantenergx" | base64 -w 0)\"}}"
    
    # Restart backend pods to pick up new connection
    log "Restarting backend pods"
    kubectl rollout restart deployment/quantenergx-backend -n "$NAMESPACE"
    kubectl rollout status deployment/quantenergx-backend -n "$NAMESPACE" --timeout=300s
    
    log "Database failover completed"
}

# Application failover
failover_application() {
    local target_region=$1
    
    log "Starting application failover to region: $target_region"
    
    # Update DNS to point to secondary region
    log "Updating DNS records"
    aws route53 change-resource-record-sets --hosted-zone-id Z123456789 --change-batch file://dns-failover-${target_region}.json
    
    # Scale up secondary region deployments
    log "Scaling up deployments in $target_region"
    kubectl config use-context "cluster-${target_region}"
    kubectl scale deployment/quantenergx-backend --replicas=5 -n "$NAMESPACE"
    kubectl scale deployment/quantenergx-frontend --replicas=3 -n "$NAMESPACE"
    
    # Wait for pods to be ready
    log "Waiting for pods to be ready in $target_region"
    kubectl rollout status deployment/quantenergx-backend -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/quantenergx-frontend -n "$NAMESPACE" --timeout=300s
    
    log "Application failover to $target_region completed"
}

# Full disaster recovery
full_disaster_recovery() {
    local target_region=$1
    
    log "Starting full disaster recovery to region: $target_region"
    
    # Failover database
    case $target_region in
        "$SECONDARY_REGION")
            failover_database "quantenergx-primary" "quantenergx-secondary-eu"
            ;;
        "$TERTIARY_REGION")
            failover_database "quantenergx-primary" "quantenergx-secondary-ap"
            ;;
    esac
    
    # Failover application
    failover_application "$target_region"
    
    # Update monitoring and alerting
    log "Updating monitoring configuration"
    kubectl apply -f /opt/quantenergx/deployment/k8s/monitoring-${target_region}.yaml
    
    # Send notifications
    log "Sending disaster recovery notifications"
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 QuantEnergx Disaster Recovery: Failed over to region '${target_region}'"}' \
        "$SLACK_WEBHOOK_URL"
    
    log "Full disaster recovery to $target_region completed"
}

# Health monitoring and automatic failover
monitor_and_failover() {
    log "Starting health monitoring for automatic failover"
    
    while true; do
        # Check primary region health
        if ! check_health "https://api.quantenergx.com" 3; then
            error "Primary region health check failed"
            
            # Check secondary region health
            if check_health "https://api-eu.quantenergx.com" 2; then
                log "Secondary region is healthy, initiating failover"
                full_disaster_recovery "$SECONDARY_REGION"
                break
            elif check_health "https://api-ap.quantenergx.com" 2; then
                log "Tertiary region is healthy, initiating failover"
                full_disaster_recovery "$TERTIARY_REGION"
                break
            else
                error "All regions are unhealthy! Manual intervention required."
                exit 1
            fi
        fi
        
        log "Primary region is healthy"
        sleep 60
    done
}

# Backup functions
backup_database() {
    local backup_name="quantenergx-backup-$(date +%Y%m%d_%H%M%S)"
    
    log "Starting database backup: $backup_name"
    
    # Create RDS snapshot
    aws rds create-db-snapshot \
        --db-instance-identifier quantenergx-primary \
        --db-snapshot-identifier "$backup_name" \
        --region "$PRIMARY_REGION"
    
    # Wait for snapshot to complete
    aws rds wait db-snapshot-completed \
        --db-snapshot-identifier "$backup_name" \
        --region "$PRIMARY_REGION"
    
    # Copy snapshot to secondary regions
    aws rds copy-db-snapshot \
        --source-db-snapshot-identifier "arn:aws:rds:${PRIMARY_REGION}:123456789012:snapshot:${backup_name}" \
        --target-db-snapshot-identifier "$backup_name" \
        --region "$SECONDARY_REGION"
    
    aws rds copy-db-snapshot \
        --source-db-snapshot-identifier "arn:aws:rds:${PRIMARY_REGION}:123456789012:snapshot:${backup_name}" \
        --target-db-snapshot-identifier "$backup_name" \
        --region "$TERTIARY_REGION"
    
    log "Database backup completed: $backup_name"
}

backup_application_data() {
    local backup_name="quantenergx-app-backup-$(date +%Y%m%d_%H%M%S)"
    
    log "Starting application data backup: $backup_name"
    
    # Backup Redis data
    kubectl exec -n "$NAMESPACE" deployment/redis -- redis-cli BGSAVE
    
    # Export Kubernetes resources
    kubectl get all -n "$NAMESPACE" -o yaml > "/tmp/${backup_name}-k8s-resources.yaml"
    
    # Upload to S3
    aws s3 cp "/tmp/${backup_name}-k8s-resources.yaml" "s3://quantenergx-backups/application/${backup_name}-k8s-resources.yaml"
    
    log "Application data backup completed: $backup_name"
}

# Test disaster recovery
test_disaster_recovery() {
    log "Starting disaster recovery test"
    
    # Create test namespace
    kubectl create namespace quantenergx-dr-test || true
    
    # Deploy test environment
    kubectl apply -f /opt/quantenergx/deployment/k8s/ -n quantenergx-dr-test
    
    # Wait for deployment
    sleep 60
    
    # Test health endpoints
    if check_health "http://quantenergx-backend-service.quantenergx-dr-test.svc.cluster.local" 3; then
        log "Disaster recovery test PASSED"
        kubectl delete namespace quantenergx-dr-test
        return 0
    else
        error "Disaster recovery test FAILED"
        return 1
    fi
}

# Restore from backup
restore_from_backup() {
    local snapshot_id=$1
    local target_region=$2
    
    log "Starting restore from backup: $snapshot_id to region: $target_region"
    
    # Restore RDS from snapshot
    aws rds restore-db-instance-from-db-snapshot \
        --db-instance-identifier "quantenergx-restored-$(date +%Y%m%d%H%M%S)" \
        --db-snapshot-identifier "$snapshot_id" \
        --region "$target_region"
    
    log "Restore from backup initiated"
}

# Main script logic
case "${1:-}" in
    "monitor")
        monitor_and_failover
        ;;
    "failover")
        if [ -z "${2:-}" ]; then
            error "Usage: $0 failover <region>"
            exit 1
        fi
        full_disaster_recovery "$2"
        ;;
    "test")
        test_disaster_recovery
        ;;
    "backup")
        backup_database
        backup_application_data
        ;;
    "restore")
        if [ -z "${2:-}" ] || [ -z "${3:-}" ]; then
            error "Usage: $0 restore <snapshot_id> <region>"
            exit 1
        fi
        restore_from_backup "$2" "$3"
        ;;
    *)
        echo "Usage: $0 {monitor|failover <region>|test|backup|restore <snapshot_id> <region>}"
        echo ""
        echo "Commands:"
        echo "  monitor              - Start health monitoring with automatic failover"
        echo "  failover <region>    - Perform manual failover to specified region"
        echo "  test                 - Test disaster recovery procedures"
        echo "  backup               - Create database and application backups"
        echo "  restore <id> <region> - Restore from backup to specified region"
        echo ""
        echo "Regions: $SECONDARY_REGION, $TERTIARY_REGION"
        exit 1
        ;;
esac