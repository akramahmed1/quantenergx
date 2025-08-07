# QuantEnergx Trial Users Guide

This guide provides information about the trial user system for QuantEnergx, including pre-configured test accounts, usage limits, and feedback integration.

## 📋 Overview

The trial user system allows prospective clients and testers to evaluate QuantEnergx's energy trading platform with limited access. Trial accounts provide a realistic trading environment with appropriate safeguards and monitoring.

## 🌍 Pre-configured Test Accounts

### United States (US) Test Accounts

#### US Energy Trader - Oil & Gas
- **Username**: `us_trial_trader_01`
- **Email**: `ustrial.trader01@quantenergx.com`
- **Password**: `USTrial!2025Demo`
- **Region**: United States
- **Market Focus**: Crude Oil, Natural Gas, Refined Products
- **Trading Permissions**: WTI Crude, Henry Hub Natural Gas, RBOB Gasoline
- **Regulatory Context**: CFTC/FERC compliant environment

#### US Renewable Energy Trader
- **Username**: `us_trial_renewable_01`
- **Email**: `ustrial.renewable01@quantenergx.com`
- **Password**: `USRenew!2025Demo`
- **Region**: United States
- **Market Focus**: Renewable Energy Certificates (RECs), Carbon Credits
- **Trading Permissions**: State REC markets, Federal tax credits
- **Regulatory Context**: EPA renewable fuel standards

### United Arab Emirates (UAE) Test Accounts

#### UAE Energy Trader - Middle East Markets
- **Username**: `uae_trial_trader_01`
- **Email**: `uaetrial.trader01@quantenergx.com`
- **Password**: `UAETrial!2025Demo`
- **Region**: United Arab Emirates
- **Market Focus**: Regional oil products, LNG, Power generation
- **Trading Permissions**: Dubai crude, Abu Dhabi crude, Regional power markets
- **Regulatory Context**: ADGM Financial Services regulatory framework

#### UAE Gas & Petrochemicals Trader
- **Username**: `uae_trial_gas_01`
- **Email**: `uaetrial.gas01@quantenergx.com`
- **Password**: `UAEGas!2025Demo`
- **Region**: United Arab Emirates
- **Market Focus**: Natural Gas, LNG, Petrochemicals
- **Trading Permissions**: Regional gas markets, Petrochemical derivatives
- **Regulatory Context**: UAE Central Bank guidelines

## 📊 Usage Limits & Restrictions

### Daily Trading Limits

#### Standard Trial Accounts
- **Maximum Trades per Day**: 50 trades
- **Maximum Order Value**: $100,000 USD per trade
- **Maximum Daily Volume**: $2,500,000 USD total
- **Position Limits**: 10 open positions maximum
- **Reset Time**: 00:00 UTC daily

#### Premium Trial Accounts (Upon Request)
- **Maximum Trades per Day**: 100 trades
- **Maximum Order Value**: $250,000 USD per trade
- **Maximum Daily Volume**: $5,000,000 USD total
- **Position Limits**: 25 open positions maximum
- **Extended Features**: Advanced analytics, Risk management tools

### Account Restrictions

- **Account Duration**: 30 days from activation
- **Extension**: Available upon request with business justification
- **Markets**: Limited to approved commodities per region
- **Risk Management**: Automatic position limits and stop-losses
- **Data Access**: Real-time data with 15-minute delay for historical analysis
- **API Access**: Read-only API access, limited write operations

### Compliance Monitoring

- **Transaction Logging**: All trades logged for audit purposes
- **Risk Monitoring**: Automated risk alerts and position monitoring  
- **Regulatory Reporting**: Simulated regulatory reports (no actual submission)
- **AML/KYC**: Simplified verification for trial purposes

## 🎧 Zendesk Feedback Integration

### Feedback Collection System

The trial user system is integrated with Zendesk to collect user feedback and provide support during the evaluation period.

#### Automatic Feedback Triggers

- **Daily Usage Reports**: Automated tickets created for daily activity summary
- **Limit Notifications**: Tickets generated when approaching daily limits
- **Feature Usage**: Feedback requests after using key platform features
- **Session Summary**: End-of-session surveys via Zendesk

#### Support Integration

- **In-Platform Support**: Direct Zendesk chat widget integration
- **Priority Support**: Trial users receive priority support queue placement
- **Technical Issues**: Automatic ticket creation for system errors
- **Feature Requests**: Streamlined feature request process

#### Feedback Categories

1. **Platform Usability**
   - User interface feedback
   - Navigation and workflow suggestions
   - Performance issues

2. **Trading Features**
   - Order management feedback
   - Market data quality
   - Risk management tool effectiveness

3. **Integration & API**
   - API functionality feedback
   - Third-party integration suggestions
   - Data export/import issues

4. **Regulatory Compliance**
   - Compliance tool feedback
   - Regulatory reporting accuracy
   - Audit trail functionality

### Zendesk Configuration

#### Ticket Assignment Rules
```
Trial User Priority: High
Auto-assignment: Trial Support Team  
SLA Response: 4 hours (business hours)
Categories: Trial Feedback, Technical Support, Feature Requests
```

#### Custom Fields for Trial Users
- Trial Account Type (US/UAE)
- Trading Volume (Daily)
- Feature Usage Tracking
- Satisfaction Score
- Conversion Likelihood

## 🚀 Getting Started with Trial Accounts

### Account Activation Process

1. **Account Request**: Submit trial account request form
2. **Region Selection**: Choose US or UAE trial environment
3. **Verification**: Basic identity verification (simplified for trials)
4. **Account Setup**: Automated account creation via setup script
5. **Onboarding**: Guided tour and training materials
6. **Support Setup**: Zendesk integration and support channel setup

### Initial Login Steps

1. Navigate to trial environment URL (provided via email)
2. Login with provided credentials
3. Complete mandatory platform tutorial (15 minutes)
4. Review trading limits and restrictions
5. Access demo trading environment
6. Begin evaluation with sample trades

### Best Practices for Trial Users

#### Maximizing Trial Value
- **Structured Testing**: Follow provided testing scenarios
- **Feature Exploration**: Test key features systematically  
- **Documentation**: Keep notes on user experience
- **Feedback**: Provide regular feedback via Zendesk integration
- **Realistic Scenarios**: Use realistic trading scenarios for evaluation

#### Common Trial Scenarios

1. **Market Data Analysis**: Evaluate real-time and historical data quality
2. **Order Management**: Test various order types and execution
3. **Risk Management**: Evaluate risk tools and position monitoring  
4. **Reporting**: Generate sample compliance and trading reports
5. **API Integration**: Test API functionality with sample applications

## 📞 Support & Contact Information

### Trial Support Team
- **Email**: trial-support@quantenergx.com
- **Zendesk Portal**: https://quantenergx.zendesk.com/trials
- **Phone Support**: +1-800-QUANT-NRG (US) / +971-4-QUANT-UAE (UAE)
- **Business Hours**: 24/7 during trial period

### Emergency Support
- **Technical Issues**: Immediate Zendesk ticket creation
- **Account Lockouts**: Automated support team notification
- **Trading Halts**: Immediate escalation to operations team

### Documentation and Resources
- **Platform Documentation**: Available in trial environment
- **API Documentation**: https://docs.quantenergx.com/api/trial
- **Video Tutorials**: https://learn.quantenergx.com/trial-users
- **FAQ**: https://support.quantenergx.com/trial-faq

## ⚖️ Legal and Compliance

### Trial Agreement Terms
- Trial accounts are for evaluation purposes only
- No real financial transactions occur during trial
- Data may be used for platform improvement (anonymized)
- Trial period expires after 30 days unless extended
- Conversion to full account requires separate agreement

### Data Protection
- GDPR compliant (EU users)
- UAE Data Protection Law compliant
- US Privacy Act compliant
- Data retention: 90 days after trial expiration
- Right to data deletion upon request

### Risk Disclaimers
- Trial environment may not reflect actual market conditions
- Historical data provided for educational purposes
- No investment advice provided during trial
- Platform performance in trial may differ from production

---

**Note**: This documentation covers the trial user system. For production account setup, please refer to the [Production Account Guide](./production-accounts.md).

Last Updated: December 2024  
Version: 1.0  
Contact: docs@quantenergx.com