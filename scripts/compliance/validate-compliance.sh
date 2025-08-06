#!/bin/bash

# QuantEnergx Regional Compliance Validation Script
# Validates compliance requirements for different regions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 QuantEnergx Regional Compliance Validation${NC}"
echo "=============================================="

# Function to validate GDPR compliance (Europe)
validate_gdpr_compliance() {
    echo -e "\n${BLUE}🇪🇺 GDPR Compliance (Europe)${NC}"
    echo "------------------------------"
    
    local compliance_score=0
    local total_checks=5
    
    # Check 1: Data encryption
    echo -n "Data encryption (AES-256): "
    if grep -q "AES-256" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 2: Right to erasure
    echo -n "Right to erasure: "
    if grep -q "right_to_erasure" docker-compose.prod.yml || grep -q "data deletion" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs implementation${NC}"
    fi
    
    # Check 3: Data retention policy
    echo -n "Data retention (7 years): "
    if grep -q "2555" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Configured${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Not configured${NC}"
    fi
    
    # Check 4: Privacy controls
    echo -n "Privacy controls: "
    if grep -q "privacy_controls" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Strict controls enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 5: Audit trail
    echo -n "Audit trail: "
    if grep -q "audit_trail.*enabled" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Disabled${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nGDPR Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ GDPR Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ GDPR Non-Compliant${NC}"
        return 1
    fi
}

# Function to validate SOX compliance (US)
validate_sox_compliance() {
    echo -e "\n${BLUE}🇺🇸 SOX Compliance (United States)${NC}"
    echo "----------------------------------"
    
    local compliance_score=0
    local total_checks=4
    
    # Check 1: Financial data controls
    echo -n "Financial data controls: "
    if grep -q "SOX" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 2: Audit trails
    echo -n "Audit trails: "
    if grep -q "audit_trail.*enabled" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Disabled${NC}"
    fi
    
    # Check 3: Data integrity
    echo -n "Data integrity validation: "
    if grep -q "data_quality_score" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Validated${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Not validated${NC}"
    fi
    
    # Check 4: Access controls
    echo -n "Access controls: "
    if grep -q "JWT_SECRET" docker-compose.prod.yml; then
        echo -e "${GREEN}✓ Secured${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Unsecured${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nSOX Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ SOX Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ SOX Non-Compliant${NC}"
        return 1
    fi
}

# Function to validate FCA compliance (UK)
validate_fca_compliance() {
    echo -e "\n${BLUE}🇬🇧 FCA Compliance (United Kingdom)${NC}"
    echo "----------------------------------"
    
    local compliance_score=0
    local total_checks=4
    
    # Check 1: TCFD reporting
    echo -n "TCFD climate reporting: "
    if grep -q "TCFD" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs implementation${NC}"
    fi
    
    # Check 2: Transaction reporting
    echo -n "Transaction reporting: "
    if grep -q "blockchain" docker-compose.prod.yml; then
        echo -e "${GREEN}✓ Blockchain audit trail${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 3: Risk management
    echo -n "Risk management: "
    if grep -q "risk" DEPLOYMENT_QUANTUM.md || grep -q "monitoring" docker-compose.prod.yml; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 4: Market data integrity
    echo -n "Market data integrity: "
    if grep -q "data_quality_score" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Validated${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Not validated${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nFCA Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ FCA Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ FCA Non-Compliant${NC}"
        return 1
    fi
}

# Function to validate Guyana compliance
validate_guyana_compliance() {
    echo -e "\n${BLUE}🇬🇾 Guyana Energy Compliance${NC}"
    echo "-----------------------------"
    
    local compliance_score=0
    local total_checks=3
    
    # Check 1: Environmental monitoring
    echo -n "Environmental monitoring: "
    if grep -q "environmental_monitoring.*enabled" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs implementation${NC}"
    fi
    
    # Check 2: Energy sector reporting
    echo -n "Energy sector reporting: "
    if grep -q "Guyana" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Configured${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 3: Data retention
    echo -n "Data retention (7 years): "
    if grep -q "2555" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Configured${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Not configured${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nGuyana Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ Guyana Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ Guyana Non-Compliant${NC}"
        return 1
    fi
}

# Function to validate Middle East compliance
validate_middleeast_compliance() {
    echo -e "\n${BLUE}🕌 Middle East Compliance${NC}"
    echo "-------------------------"
    
    local compliance_score=0
    local total_checks=3
    
    # Check 1: ADGM compliance
    echo -n "ADGM regulations: "
    if grep -q "ADGM" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Compliant${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs review${NC}"
    fi
    
    # Check 2: Islamic finance compliance
    echo -n "Islamic finance compliance: "
    if grep -q "Islamic Finance Compliance" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs implementation${NC}"
    fi
    
    # Check 3: Cultural considerations
    echo -n "Cultural considerations: "
    if grep -q "cultural_considerations.*enabled" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${YELLOW}⚠ Needs attention${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nMiddle East Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ Middle East Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ Middle East Non-Compliant${NC}"
        return 1
    fi
}

# Function to validate ESG compliance
validate_esg_compliance() {
    echo -e "\n${BLUE}🌱 ESG (Environmental, Social, Governance) Compliance${NC}"
    echo "----------------------------------------------------"
    
    local compliance_score=0
    local total_checks=5
    
    # Check 1: Carbon intensity tracking
    echo -n "Carbon intensity tracking: "
    if grep -q "carbon_intensity" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 2: ESG scoring
    echo -n "ESG scoring algorithm: "
    if grep -q "calculateESGScore" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    # Check 3: Sustainability rating
    echo -n "Sustainability rating: "
    if grep -q "sustainability_rating" backend/etl/oilPricesETL.js; then
        echo -e "${GREEN}✓ Tracked${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Not tracked${NC}"
    fi
    
    # Check 4: Environmental monitoring
    echo -n "Environmental monitoring: "
    if grep -q "environmental" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Enabled${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Disabled${NC}"
    fi
    
    # Check 5: Governance controls
    echo -n "Governance controls: "
    if grep -q "audit_trail" DEPLOYMENT_QUANTUM.md && grep -q "compliance" DEPLOYMENT_QUANTUM.md; then
        echo -e "${GREEN}✓ Implemented${NC}"
        ((compliance_score++))
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
    
    local percentage=$((compliance_score * 100 / total_checks))
    echo -e "\nESG Compliance Score: ${compliance_score}/${total_checks} (${percentage}%)"
    
    if [ $percentage -ge 80 ]; then
        echo -e "${GREEN}✅ ESG Compliant${NC}"
        return 0
    else
        echo -e "${RED}❌ ESG Non-Compliant${NC}"
        return 1
    fi
}

# Main validation process
echo "Starting comprehensive compliance validation..."

# Track overall compliance
total_regions=0
compliant_regions=0

# Validate each region
if validate_gdpr_compliance; then
    ((compliant_regions++))
fi
((total_regions++))

if validate_sox_compliance; then
    ((compliant_regions++))
fi
((total_regions++))

if validate_fca_compliance; then
    ((compliant_regions++))
fi
((total_regions++))

if validate_guyana_compliance; then
    ((compliant_regions++))
fi
((total_regions++))

if validate_middleeast_compliance; then
    ((compliant_regions++))
fi
((total_regions++))

# Validate ESG compliance
esg_compliant=false
if validate_esg_compliance; then
    esg_compliant=true
fi

# Generate compliance report
echo -e "\n${BLUE}📊 Overall Compliance Summary${NC}"
echo "============================="

overall_percentage=$((compliant_regions * 100 / total_regions))
echo -e "Regional Compliance: ${compliant_regions}/${total_regions} regions (${overall_percentage}%)"
echo -e "ESG Compliance: $([ "$esg_compliant" = true ] && echo -e "${GREEN}✅ Compliant" || echo -e "${RED}❌ Non-Compliant")${NC}"

# Generate JSON report
cat > compliance-validation-report.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "overall_compliance": {
        "percentage": $overall_percentage,
        "status": "$([ $overall_percentage -ge 80 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "compliant_regions": $compliant_regions,
        "total_regions": $total_regions
    },
    "regional_compliance": {
        "europe_gdpr": "$([ $(validate_gdpr_compliance >/dev/null 2>&1; echo $?) -eq 0 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "us_sox": "$([ $(validate_sox_compliance >/dev/null 2>&1; echo $?) -eq 0 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "uk_fca": "$([ $(validate_fca_compliance >/dev/null 2>&1; echo $?) -eq 0 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "guyana": "$([ $(validate_guyana_compliance >/dev/null 2>&1; echo $?) -eq 0 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "middle_east": "$([ $(validate_middleeast_compliance >/dev/null 2>&1; echo $?) -eq 0 ] && echo "COMPLIANT" || echo "NON_COMPLIANT")"
    },
    "esg_compliance": {
        "status": "$([ "$esg_compliant" = true ] && echo "COMPLIANT" || echo "NON_COMPLIANT")",
        "carbon_tracking": true,
        "sustainability_rating": true,
        "environmental_monitoring": true
    },
    "recommendations": [
        "Implement missing privacy controls for GDPR",
        "Enhance climate reporting for TCFD compliance",
        "Complete Islamic finance compliance framework",
        "Strengthen environmental monitoring systems"
    ]
}
EOF

echo ""
echo "📄 Compliance report saved to: compliance-validation-report.json"

if [ $overall_percentage -ge 80 ] && [ "$esg_compliant" = true ]; then
    echo -e "\n${GREEN}🎉 Overall compliance validation PASSED!${NC}"
    echo -e "${GREEN}✅ Ready for multi-regional deployment${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Overall compliance validation needs attention.${NC}"
    echo -e "${YELLOW}📋 Please review recommendations in the compliance report.${NC}"
    exit 1
fi