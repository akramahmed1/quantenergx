#!/bin/bash

# QuantEnergx Trial User Setup Script
# This script automates the creation of trial users, enforces usage limits,
# and configures Zendesk integration for rapid feedback collection.
#
# Usage: ./setup-trial.sh [options]
# Options:
#   -r, --region       Specify region (us|uae) - default: us  
#   -t, --type         Account type (standard|premium) - default: standard
#   -u, --username     Custom username (optional)
#   -e, --email        Custom email (optional)  
#   -d, --duration     Trial duration in days (default: 30)
#   -z, --zendesk      Enable Zendesk integration (default: true)
#   -h, --help         Show this help message
#
# Examples:
#   ./setup-trial.sh --region us --type standard
#   ./setup-trial.sh --region uae --type premium --duration 45
#   ./setup-trial.sh --username custom_trial_01 --email test@company.com

set -e  # Exit on any error

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="QuantEnergx Trial Setup"
CREATED_DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration values
DEFAULT_REGION="us"
DEFAULT_ACCOUNT_TYPE="standard"
DEFAULT_DURATION=30
DEFAULT_ZENDESK_ENABLED=true

# Configuration variables (will be set by command line args)
REGION=""
ACCOUNT_TYPE=""
CUSTOM_USERNAME=""
CUSTOM_EMAIL=""
TRIAL_DURATION=""
ZENDESK_ENABLED=""

# Environment-specific configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-quantenergx_trial}"
DB_USER="${DB_USER:-quantenergx_user}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Zendesk configuration (these would be real values in production)
ZENDESK_DOMAIN="${ZENDESK_DOMAIN:-quantenergx.zendesk.com}"
ZENDESK_API_TOKEN="${ZENDESK_API_TOKEN:-your_api_token_here}"
ZENDESK_EMAIL="${ZENDESK_EMAIL:-support@quantenergx.com}"

# Usage limits configuration
USAGE_LIMITS_CONFIG="/tmp/trial_usage_limits.json"

#=============================================================================
# Utility Functions
#=============================================================================

# Print formatted messages
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🚀 $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" >> "/tmp/trial-setup.log"
}

# Error handling
handle_error() {
    local error_message="$1"
    local line_number="$2"
    print_error "Script failed at line $line_number: $error_message"
    log "ERROR" "Script failed at line $line_number: $error_message"
    cleanup_on_error
    exit 1
}

# Set up error trapping
trap 'handle_error "Unexpected error occurred" $LINENO' ERR

#=============================================================================
# Help and Usage Functions
#=============================================================================

show_help() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION

DESCRIPTION:
    Automates the creation of trial users for the QuantEnergx energy trading platform.
    Creates user accounts with appropriate usage limits, regional settings, and 
    Zendesk feedback integration for comprehensive trial experience.

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -r, --region REGION        Target region (us|uae)
                              us  = United States (default)
                              uae = United Arab Emirates
    
    -t, --type TYPE           Account type (standard|premium)
                              standard = 50 trades/day, \$100K max per trade
                              premium  = 100 trades/day, \$250K max per trade
    
    -u, --username USERNAME   Custom username (auto-generated if not provided)
    -e, --email EMAIL         Custom email address (auto-generated if not provided)
    -d, --duration DAYS       Trial duration in days (default: 30, max: 90)
    -z, --zendesk BOOLEAN     Enable Zendesk integration (true|false, default: true)
    -h, --help               Show this help message

EXAMPLES:
    # Create standard US trial account with defaults
    $0 --region us --type standard
    
    # Create premium UAE trial account with custom duration
    $0 --region uae --type premium --duration 45
    
    # Create custom trial account with specific username and email
    $0 --username "company_trial_01" --email "trial@company.com" --region us
    
    # Create trial account without Zendesk integration
    $0 --region uae --zendesk false

ENVIRONMENT VARIABLES:
    DB_HOST              Database host (default: localhost)
    DB_PORT              Database port (default: 5432)
    DB_NAME              Database name (default: quantenergx_trial)
    DB_USER              Database user (default: quantenergx_user)
    REDIS_HOST           Redis host (default: localhost)
    REDIS_PORT           Redis port (default: 6379)
    ZENDESK_DOMAIN       Zendesk domain (default: quantenergx.zendesk.com)
    ZENDESK_API_TOKEN    Zendesk API token for integration
    ZENDESK_EMAIL        Zendesk support email

FILES CREATED:
    /tmp/trial-setup.log           Setup process log
    /tmp/trial_user_credentials    Generated credentials (deleted after display)
    /tmp/trial_usage_limits.json   Usage limits configuration

NOTES:
    • This script uses placeholder logic for production systems
    • Actual database connections and Zendesk integration require proper credentials
    • In production, ensure proper security measures for credential handling
    • Trial accounts are automatically expired after the specified duration

EOF
}

#=============================================================================
# Argument Parsing
#=============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--region)
                REGION="$2"
                if [[ "$REGION" != "us" && "$REGION" != "uae" ]]; then
                    print_error "Invalid region: $REGION. Must be 'us' or 'uae'"
                    exit 1
                fi
                shift 2
                ;;
            -t|--type)
                ACCOUNT_TYPE="$2"
                if [[ "$ACCOUNT_TYPE" != "standard" && "$ACCOUNT_TYPE" != "premium" ]]; then
                    print_error "Invalid account type: $ACCOUNT_TYPE. Must be 'standard' or 'premium'"
                    exit 1
                fi
                shift 2
                ;;
            -u|--username)
                CUSTOM_USERNAME="$2"
                shift 2
                ;;
            -e|--email)
                CUSTOM_EMAIL="$2"
                # Basic email validation
                if [[ ! "$CUSTOM_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                    print_error "Invalid email format: $CUSTOM_EMAIL"
                    exit 1
                fi
                shift 2
                ;;
            -d|--duration)
                TRIAL_DURATION="$2"
                if [[ ! "$TRIAL_DURATION" =~ ^[0-9]+$ ]] || [[ "$TRIAL_DURATION" -lt 1 ]] || [[ "$TRIAL_DURATION" -gt 90 ]]; then
                    print_error "Invalid duration: $TRIAL_DURATION. Must be between 1 and 90 days"
                    exit 1
                fi
                shift 2
                ;;
            -z|--zendesk)
                ZENDESK_ENABLED="$2"
                if [[ "$ZENDESK_ENABLED" != "true" && "$ZENDESK_ENABLED" != "false" ]]; then
                    print_error "Invalid Zendesk option: $ZENDESK_ENABLED. Must be 'true' or 'false'"
                    exit 1
                fi
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Set defaults for unspecified options
    REGION="${REGION:-$DEFAULT_REGION}"
    ACCOUNT_TYPE="${ACCOUNT_TYPE:-$DEFAULT_ACCOUNT_TYPE}"
    TRIAL_DURATION="${TRIAL_DURATION:-$DEFAULT_DURATION}"
    ZENDESK_ENABLED="${ZENDESK_ENABLED:-$DEFAULT_ZENDESK_ENABLED}"
}

#=============================================================================
# Configuration and Validation Functions
#=============================================================================

validate_environment() {
    print_step "Validating environment prerequisites..."
    
    # Check required commands
    local required_commands=("curl" "jq" "psql" "redis-cli")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            print_warning "Required command not found: $cmd"
            print_info "In production environment, ensure all required tools are installed"
        else
            print_success "Command available: $cmd"
        fi
    done
    
    # Check database connectivity (placeholder logic)
    print_step "Checking database connectivity..."
    if ping -c 1 "$DB_HOST" &> /dev/null; then
        print_success "Database host reachable: $DB_HOST"
    else
        print_warning "Database host not reachable: $DB_HOST (using placeholder logic)"
        print_info "In production: Verify database connection and credentials"
    fi
    
    # Check Redis connectivity (placeholder logic)
    print_step "Checking Redis connectivity..."
    if ping -c 1 "$REDIS_HOST" &> /dev/null; then
        print_success "Redis host reachable: $REDIS_HOST"
    else
        print_warning "Redis host not reachable: $REDIS_HOST (using placeholder logic)"
        print_info "In production: Verify Redis connection and credentials"
    fi
    
    log "INFO" "Environment validation completed"
}

generate_credentials() {
    print_step "Generating trial user credentials..."
    
    # Generate username if not provided
    if [[ -z "$CUSTOM_USERNAME" ]]; then
        local timestamp=$(date +%s)
        local random_suffix=$(( RANDOM % 1000 + 1 ))
        CUSTOM_USERNAME="${REGION}_trial_${ACCOUNT_TYPE}_${random_suffix}"
    fi
    
    # Generate email if not provided
    if [[ -z "$CUSTOM_EMAIL" ]]; then
        CUSTOM_EMAIL="${CUSTOM_USERNAME}@quantenergx.com"
    fi
    
    # Generate secure password
    local password="Trial$(date +%Y)!$(( RANDOM % 10000 + 1000 ))"
    
    # Store credentials temporarily for database insertion
    cat > "/tmp/trial_user_credentials" << EOF
{
    "username": "$CUSTOM_USERNAME",
    "email": "$CUSTOM_EMAIL", 
    "password": "$password",
    "region": "$REGION",
    "account_type": "$ACCOUNT_TYPE",
    "trial_duration": $TRIAL_DURATION,
    "created_date": "$CREATED_DATE",
    "expiry_date": "$(date -d "+$TRIAL_DURATION days" "+%Y-%m-%d %H:%M:%S")"
}
EOF

    print_success "Credentials generated for user: $CUSTOM_USERNAME"
    log "INFO" "Generated credentials for user: $CUSTOM_USERNAME"
}

create_usage_limits_config() {
    print_step "Creating usage limits configuration..."
    
    # Set limits based on account type
    if [[ "$ACCOUNT_TYPE" == "premium" ]]; then
        MAX_DAILY_TRADES=100
        MAX_ORDER_VALUE=250000
        MAX_DAILY_VOLUME=5000000
        MAX_POSITIONS=25
    else
        MAX_DAILY_TRADES=50
        MAX_ORDER_VALUE=100000  
        MAX_DAILY_VOLUME=2500000
        MAX_POSITIONS=10
    fi
    
    # Create usage limits configuration file
    cat > "$USAGE_LIMITS_CONFIG" << EOF
{
    "user_limits": {
        "username": "$CUSTOM_USERNAME",
        "account_type": "$ACCOUNT_TYPE",
        "region": "$REGION",
        "limits": {
            "max_daily_trades": $MAX_DAILY_TRADES,
            "max_order_value_usd": $MAX_ORDER_VALUE,
            "max_daily_volume_usd": $MAX_DAILY_VOLUME,
            "max_open_positions": $MAX_POSITIONS,
            "api_calls_per_minute": 60,
            "api_calls_per_hour": 1000
        },
        "restrictions": {
            "markets_allowed": $(get_allowed_markets),
            "trading_hours": "24/7",
            "weekend_trading": true,
            "risk_management": {
                "auto_stop_loss": true,
                "position_monitoring": true,
                "margin_requirements": "standard"
            }
        },
        "trial_settings": {
            "duration_days": $TRIAL_DURATION,
            "auto_expire": true,
            "extension_allowed": true,
            "data_retention_days": 90
        }
    },
    "monitoring": {
        "real_time_tracking": true,
        "daily_reports": true,
        "alert_thresholds": {
            "trade_limit_warning": 0.8,
            "volume_limit_warning": 0.8,
            "position_limit_warning": 0.9
        }
    }
}
EOF

    print_success "Usage limits configured: $MAX_DAILY_TRADES trades/day, \$$MAX_ORDER_VALUE max per trade"
    log "INFO" "Usage limits configuration created for $CUSTOM_USERNAME"
}

get_allowed_markets() {
    if [[ "$REGION" == "us" ]]; then
        echo '["WTI_CRUDE", "HENRY_HUB_GAS", "RBOB_GASOLINE", "HEATING_OIL", "US_REC", "CARBON_CREDITS"]'
    else  # UAE
        echo '["DUBAI_CRUDE", "ABU_DHABI_CRUDE", "ME_LNG", "REGIONAL_POWER", "UAE_GAS", "PETROCHEMICALS"]'
    fi
}

#=============================================================================
# Database Operations (Placeholder Logic)
#=============================================================================

create_user_in_database() {
    print_step "Creating user in database..."
    
    # In production, this would execute actual database commands
    # For now, we simulate the database operations
    
    local creds_file="/tmp/trial_user_credentials"
    if [[ ! -f "$creds_file" ]]; then
        print_error "Credentials file not found: $creds_file"
        return 1
    fi
    
    print_info "PLACEHOLDER: Database user creation"
    print_info "In production, this would execute:"
    echo "  INSERT INTO trial_users (username, email, password_hash, region, account_type, trial_expires, created_at)"
    echo "  VALUES ('$CUSTOM_USERNAME', '$CUSTOM_EMAIL', '$(hash_password)', '$REGION', '$ACCOUNT_TYPE', '$(date -d "+$TRIAL_DURATION days")', NOW());"
    
    # Simulate database success
    sleep 1
    print_success "Database user created (simulated): $CUSTOM_USERNAME"
    log "INFO" "Database user creation simulated for $CUSTOM_USERNAME"
}

hash_password() {
    # Placeholder for password hashing
    echo "bcrypt_hashed_password_placeholder"
}

configure_user_permissions() {
    print_step "Configuring user permissions and market access..."
    
    print_info "PLACEHOLDER: Permission configuration"
    print_info "In production, this would:"
    echo "  - Assign regional trading permissions"
    echo "  - Configure market data access levels"
    echo "  - Set up risk management rules"
    echo "  - Enable compliance monitoring"
    
    # Simulate permission setup
    sleep 1
    print_success "User permissions configured (simulated)"
    log "INFO" "User permissions configured for $CUSTOM_USERNAME"
}

#=============================================================================
# Usage Limits Enforcement
#=============================================================================

setup_usage_limits() {
    print_step "Setting up usage limits enforcement..."
    
    # In production, this would configure Redis-based rate limiting
    print_info "PLACEHOLDER: Usage limits setup"
    print_info "Configuring limits in Redis:"
    echo "  - Daily trade counter: quantenergx:trial:$CUSTOM_USERNAME:daily_trades"
    echo "  - Volume tracker: quantenergx:trial:$CUSTOM_USERNAME:daily_volume" 
    echo "  - Position counter: quantenergx:trial:$CUSTOM_USERNAME:positions"
    echo "  - API rate limits: quantenergx:trial:$CUSTOM_USERNAME:api_calls"
    
    # Simulate Redis configuration
    if [[ -f "$USAGE_LIMITS_CONFIG" ]]; then
        print_info "Usage limits loaded from: $USAGE_LIMITS_CONFIG"
        print_success "Usage limits enforcement configured (simulated)"
    else
        print_error "Usage limits config file not found"
        return 1
    fi
    
    log "INFO" "Usage limits enforcement configured for $CUSTOM_USERNAME"
}

create_monitoring_alerts() {
    print_step "Setting up monitoring and alerts..."
    
    print_info "PLACEHOLDER: Monitoring setup"
    print_info "In production, this would configure:"
    echo "  - Real-time usage monitoring"
    echo "  - Threshold-based alerts"
    echo "  - Daily usage reports"
    echo "  - Automated limit enforcement"
    
    # Create monitoring configuration (simulated)
    cat > "/tmp/monitoring_config_$CUSTOM_USERNAME.json" << EOF
{
    "user": "$CUSTOM_USERNAME",
    "monitoring": {
        "real_time_tracking": true,
        "alert_email": "$CUSTOM_EMAIL",
        "daily_reports": true,
        "threshold_alerts": {
            "trade_limit_80_percent": true,
            "volume_limit_80_percent": true,
            "position_limit_90_percent": true
        }
    }
}
EOF

    print_success "Monitoring and alerts configured (simulated)"
    log "INFO" "Monitoring configuration created for $CUSTOM_USERNAME"
}

#=============================================================================
# Zendesk Integration (Placeholder Logic)
#=============================================================================

setup_zendesk_integration() {
    if [[ "$ZENDESK_ENABLED" != "true" ]]; then
        print_info "Zendesk integration disabled - skipping setup"
        return 0
    fi
    
    print_step "Setting up Zendesk feedback integration..."
    
    # Create Zendesk user (placeholder)
    create_zendesk_user
    
    # Configure feedback triggers
    configure_feedback_triggers
    
    # Set up support integration
    setup_support_integration
    
    print_success "Zendesk integration configured"
}

create_zendesk_user() {
    print_info "PLACEHOLDER: Creating Zendesk user"
    print_info "In production, this would execute:"
    echo "  curl -X POST https://$ZENDESK_DOMAIN/api/v2/users.json \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -u '$ZENDESK_EMAIL/token:$ZENDESK_API_TOKEN' \\"
    echo "    -d '{\"user\": {\"name\": \"Trial User\", \"email\": \"$CUSTOM_EMAIL\", \"role\": \"end-user\"}}'"
    
    # Simulate Zendesk user creation
    sleep 1
    print_success "Zendesk user created (simulated): $CUSTOM_EMAIL"
    log "INFO" "Zendesk user creation simulated for $CUSTOM_EMAIL"
}

configure_feedback_triggers() {
    print_info "PLACEHOLDER: Configuring feedback triggers"
    print_info "Setting up automated feedback collection:"
    echo "  - Daily usage summary tickets"
    echo "  - Feature usage feedback prompts"
    echo "  - Limit warning notifications"
    echo "  - Session end surveys"
    
    # Create feedback trigger configuration
    cat > "/tmp/zendesk_triggers_$CUSTOM_USERNAME.json" << EOF
{
    "user": "$CUSTOM_USERNAME",
    "feedback_triggers": {
        "daily_summary": {
            "enabled": true,
            "time": "23:00 UTC",
            "template": "daily_trial_summary"
        },
        "limit_warnings": {
            "trade_limit_80": true,
            "volume_limit_80": true,
            "position_limit_90": true
        },
        "feature_feedback": {
            "after_first_trade": true,
            "after_report_generation": true,
            "after_api_usage": true
        },
        "session_surveys": {
            "enabled": true,
            "frequency": "weekly"
        }
    }
}
EOF

    print_success "Feedback triggers configured (simulated)"
}

setup_support_integration() {
    print_info "PLACEHOLDER: Setting up support integration"
    print_info "Configuring trial user support:"
    echo "  - Priority queue assignment"
    echo "  - Specialized trial support team routing"
    echo "  - In-platform chat widget integration"
    echo "  - Automated escalation rules"
    
    # Simulate support configuration
    print_success "Support integration configured (simulated)"
    log "INFO" "Support integration configured for $CUSTOM_USERNAME"
}

#=============================================================================
# Cleanup and Final Steps
#=============================================================================

display_credentials() {
    print_header "Trial Account Successfully Created!"
    
    local creds_file="/tmp/trial_user_credentials"
    if [[ -f "$creds_file" ]]; then
        local username=$(jq -r '.username' "$creds_file")
        local email=$(jq -r '.email' "$creds_file") 
        local password=$(jq -r '.password' "$creds_file")
        local expiry=$(jq -r '.expiry_date' "$creds_file")
        
        echo -e "${GREEN}📋 TRIAL ACCOUNT DETAILS${NC}"
        echo -e "${GREEN}══════════════════════════════════${NC}"
        echo -e "${CYAN}Username:${NC}     $username"
        echo -e "${CYAN}Email:${NC}        $email"
        echo -e "${CYAN}Password:${NC}     $password"
        echo -e "${CYAN}Region:${NC}       ${REGION^^}"
        echo -e "${CYAN}Account Type:${NC} ${ACCOUNT_TYPE^}"
        echo -e "${CYAN}Trial Expires:${NC} $expiry"
        echo ""
        echo -e "${YELLOW}🔐 SECURITY NOTE:${NC}"
        echo -e "${YELLOW}Please change the password after first login${NC}"
        echo -e "${YELLOW}Store these credentials securely${NC}"
        echo ""
        
        # Display usage limits
        if [[ -f "$USAGE_LIMITS_CONFIG" ]]; then
            local max_trades=$(jq -r '.user_limits.limits.max_daily_trades' "$USAGE_LIMITS_CONFIG")
            local max_order=$(jq -r '.user_limits.limits.max_order_value_usd' "$USAGE_LIMITS_CONFIG")
            local max_volume=$(jq -r '.user_limits.limits.max_daily_volume_usd' "$USAGE_LIMITS_CONFIG")
            
            echo -e "${BLUE}📊 USAGE LIMITS${NC}"
            echo -e "${BLUE}═══════════════════════${NC}"
            echo -e "${CYAN}Daily Trades:${NC}     $max_trades maximum"
            echo -e "${CYAN}Order Value:${NC}      \$$(printf "%'d" $max_order) maximum"
            echo -e "${CYAN}Daily Volume:${NC}     \$$(printf "%'d" $max_volume) maximum"
            echo ""
        fi
        
        # Display access information  
        echo -e "${PURPLE}🌐 ACCESS INFORMATION${NC}"
        echo -e "${PURPLE}══════════════════════════════════${NC}"
        echo -e "${CYAN}Trial Portal:${NC}     https://trial.quantenergx.com/"
        echo -e "${CYAN}API Endpoint:${NC}     https://api-trial.quantenergx.com/"
        echo -e "${CYAN}Documentation:${NC}    https://docs.quantenergx.com/trial/"
        echo -e "${CYAN}Support:${NC}          trial-support@quantenergx.com"
        if [[ "$ZENDESK_ENABLED" == "true" ]]; then
            echo -e "${CYAN}Help Portal:${NC}      https://$ZENDESK_DOMAIN/trials"
        fi
        echo ""
        
        echo -e "${GREEN}🎉 Your trial account is ready to use!${NC}"
        echo -e "${GREEN}Please refer to docs/trial-users.md for detailed usage instructions${NC}"
        
        log "INFO" "Trial account created successfully: $username"
    else
        print_error "Could not display credentials - file not found"
    fi
}

cleanup_on_error() {
    print_warning "Cleaning up after error..."
    
    # Clean up temporary files
    rm -f "/tmp/trial_user_credentials"
    rm -f "$USAGE_LIMITS_CONFIG"
    rm -f "/tmp/monitoring_config_$CUSTOM_USERNAME.json" 2>/dev/null
    rm -f "/tmp/zendesk_triggers_$CUSTOM_USERNAME.json" 2>/dev/null
    
    log "INFO" "Cleanup completed after error"
}

cleanup() {
    print_step "Cleaning up temporary files..."
    
    # Securely remove credentials file
    if [[ -f "/tmp/trial_user_credentials" ]]; then
        shred -u "/tmp/trial_user_credentials" 2>/dev/null || rm -f "/tmp/trial_user_credentials"
        print_success "Credentials file securely removed"
    fi
    
    # Keep configuration files for reference (would be in persistent storage in production)
    print_info "Configuration files retained in /tmp for reference"
    print_info "In production: Store configuration in secure persistent storage"
    
    log "INFO" "Cleanup completed successfully"
}

#=============================================================================
# Main Script Execution
#=============================================================================

main() {
    print_header "$SCRIPT_NAME v$SCRIPT_VERSION"
    
    # Initialize logging
    echo "=================== TRIAL SETUP SESSION START ===================" > "/tmp/trial-setup.log"
    log "INFO" "Script started with args: $*"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    print_info "Configuration: Region=$REGION, Type=$ACCOUNT_TYPE, Duration=$TRIAL_DURATION days"
    print_info "Zendesk Integration: $ZENDESK_ENABLED"
    
    # Execute main workflow
    validate_environment
    generate_credentials  
    create_usage_limits_config
    create_user_in_database
    configure_user_permissions
    setup_usage_limits
    create_monitoring_alerts
    setup_zendesk_integration
    
    # Display results
    display_credentials
    
    # Cleanup
    cleanup
    
    print_header "Trial Setup Completed Successfully!"
    print_success "Log file: /tmp/trial-setup.log"
    print_info "Next steps: Share credentials with trial user and provide docs/trial-users.md"
    
    log "INFO" "Script completed successfully"
    echo "==================== TRIAL SETUP SESSION END ====================" >> "/tmp/trial-setup.log"
}

# Execute main function with all arguments
main "$@"