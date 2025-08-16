#
# Web Application Firewall (WAF) Rules

- Block SQL injection patterns
- Rate limit API endpoints
- Allow only HTTPS traffic
- Block known malicious IPs
# Web Application Firewall (WAF) Configuration for QuantEnergx

## Overview

This document provides configuration examples for setting up a Web Application Firewall (WAF) to protect the QuantEnergx platform. The configurations are provided for different WAF solutions.

## AWS WAF Configuration

### 1. Basic Rule Set

```json
{
  "Name": "QuantEnergxBasicRules",
  "Scope": "CLOUDFRONT",
  "DefaultAction": {
    "Allow": {}
  },
  "Rules": [
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {
        "None": {}
      },
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRuleSetMetric"
      }
    },
    {
      "Name": "AWSManagedRulesKnownBadInputsRuleSet",
      "Priority": 2,
      "OverrideAction": {
        "None": {}
      },
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesKnownBadInputsRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "KnownBadInputsMetric"
      }
    }
  ]
}
```

### 2. Rate Limiting Rules

```json
{
  "Name": "RateLimitRule",
  "Priority": 10,
  "Action": {
    "Block": {}
  },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "RateLimitMetric"
  }
}
```

### 3. API Protection Rules

```json
{
  "Name": "APIProtectionRule",
  "Priority": 15,
  "Action": {
    "Block": {}
  },
  "Statement": {
    "AndStatement": {
      "Statements": [
        {
          "ByteMatchStatement": {
            "SearchString": "/api/",
            "FieldToMatch": {
              "UriPath": {}
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "STARTS_WITH"
          }
        },
        {
          "NotStatement": {
            "Statement": {
              "IPSetReferenceStatement": {
                "ARN": "arn:aws:wafv2:region:account:regional/ipset/AllowedIPs/id"
              }
            }
          }
        }
      ]
    }
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "APIProtectionMetric"
  }
}
```

## Cloudflare WAF Configuration

### 1. Custom Rules

```javascript
// Rate limiting rule for login endpoints
(http.request.uri.path contains "/api/v1/users/auth/login" and 
 http.request.method eq "POST") and 
(rate(1m) > 5)

// Block suspicious user agents
(http.user_agent contains "sqlmap" or 
 http.user_agent contains "nmap" or 
 http.user_agent contains "nikto")

// Block common attack patterns
(http.request.body contains "<script" or 
 http.request.body contains "javascript:" or 
 http.request.uri.query contains "union select")
```

### 2. Zone Lockdown Rules

```json
{
  "paused": false,
  "description": "Protect admin endpoints",
  "urls": [
    "quantenergx.com/api/v1/admin/*"
  ],
  "configurations": [
    {
      "target": "ip",
      "value": "192.168.1.0/24"
    }
  ]
}
```

## Nginx ModSecurity Configuration

### 1. Basic Configuration

```nginx
# Load ModSecurity module
load_module modules/ngx_http_modsecurity_module.so;

http {
    # Enable ModSecurity
    modsecurity on;
    modsecurity_rules_file /etc/nginx/modsec/main.conf;
    
    server {
        listen 443 ssl;
        server_name quantenergx.com;
        
        # SSL configuration
        ssl_certificate /path/to/certificate.crt;
        ssl_certificate_key /path/to/private.key;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
        limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
        
        location /api/v1/users/auth/ {
            limit_req zone=auth burst=3 nodelay;
            proxy_pass http://backend;
        }
        
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
        }
        
        location / {
            proxy_pass http://frontend;
        }
    }
}
```

### 2. ModSecurity Rules

```apache
# /etc/nginx/modsec/main.conf

# Include OWASP Core Rule Set
Include /etc/nginx/modsec/crs/crs-setup.conf
Include /etc/nginx/modsec/crs/rules/*.conf

# Custom rules for QuantEnergx
SecRule REQUEST_URI "@contains /api/v1/users/auth" \
    "id:1001,\
    phase:1,\
    block,\
    msg:'Multiple failed login attempts',\
    logdata:'IP: %{REMOTE_ADDR}',\
    setvar:'ip.failed_logins=+1',\
    expirevar:'ip.failed_logins=300',\
    chain"
    SecRule IP:FAILED_LOGINS "@gt 5" \
        "t:none"

# Block SQL injection attempts
SecRule ARGS "@detectSQLi" \
    "id:1002,\
    phase:2,\
    block,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}: %{MATCHED_VAR}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-sqli'"

# Block XSS attempts
SecRule ARGS "@detectXSS" \
    "id:1003,\
    phase:2,\
    block,\
    msg:'XSS Attack Detected',\
    logdata:'Matched Data: %{MATCHED_VAR} found within %{MATCHED_VAR_NAME}: %{MATCHED_VAR}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-xss'"
```

## Application-Level WAF (Express Middleware)

### 1. Custom WAF Middleware

```javascript
// backend/src/middleware/waf.js
const rateLimit = require('express-rate-limit');

class ApplicationWAF {
  constructor() {
    this.suspiciousPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i
    ];
    
    this.blockedUserAgents = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /w3af/i,
      /dirbuster/i
    ];
  }

  // Check for malicious patterns
  checkMaliciousPatterns() {
    return (req, res, next) => {
      const checkString = JSON.stringify(req.body) + req.url + (req.get('User-Agent') || '');
      
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(checkString)) {
          console.warn(`Malicious pattern detected: ${pattern} from IP: ${req.ip}`);
          return res.status(403).json({
            error: 'Request blocked by security policy'
          });
        }
      }
      
      next();
    };
  }

  // Block suspicious user agents
  checkUserAgent() {
    return (req, res, next) => {
      const userAgent = req.get('User-Agent') || '';
      
      for (const pattern of this.blockedUserAgents) {
        if (pattern.test(userAgent)) {
          console.warn(`Blocked user agent: ${userAgent} from IP: ${req.ip}`);
          return res.status(403).json({
            error: 'Access denied'
          });
        }
      }
      
      next();
    };
  }

  // Geographic blocking
  checkGeolocation() {
    return (req, res, next) => {
      const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];
      const country = req.get('CF-IPCountry') || req.get('X-Country-Code');
      
      if (country && blockedCountries.includes(country)) {
        console.warn(`Blocked request from country: ${country}, IP: ${req.ip}`);
        return res.status(403).json({
          error: 'Access denied from this location'
        });
      }
      
      next();
    };
  }

  // Request size limiting
  checkRequestSize() {
    return (req, res, next) => {
      const maxSize = process.env.MAX_REQUEST_SIZE || 1024 * 1024; // 1MB default
      const contentLength = req.get('Content-Length');
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        console.warn(`Large request blocked: ${contentLength} bytes from IP: ${req.ip}`);
        return res.status(413).json({
          error: 'Request entity too large'
        });
      }
      
      next();
    };
  }

  // Apply all WAF rules
  applyWAFRules() {
    return [
      this.checkUserAgent(),
      this.checkMaliciousPatterns(),
      this.checkGeolocation(),
      this.checkRequestSize()
    ];
  }
}

module.exports = new ApplicationWAF();
```

### 2. WAF Integration

```javascript
// backend/src/server.js
const waf = require('./middleware/waf');

// Apply WAF rules before other middleware
app.use(waf.applyWAFRules());
```

## Monitoring and Alerting

### 1. CloudWatch Metrics (AWS)

```json
{
  "MetricName": "WAFBlockedRequests",
  "Namespace": "WAF/QuantEnergx",
  "Dimensions": [
    {
      "Name": "RuleName",
      "Value": "CommonRuleSet"
    }
  ],
  "Value": 1,
  "Unit": "Count"
}
```

### 2. Log Analysis

```bash
# Analyze WAF logs for patterns
grep "BLOCK" /var/log/waf.log | awk '{print $1}' | sort | uniq -c | sort -nr

# Monitor for specific attack types
grep "SQLi" /var/log/waf.log | tail -10

# Check rate limiting effectiveness
grep "rate_limit" /var/log/waf.log | wc -l
```

## Testing WAF Configuration

### 1. Security Testing Commands

```bash
# Test SQL injection blocking
curl -X POST "https://quantenergx.com/api/v1/users/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR 1=1--","password":"test"}'

# Test XSS blocking
curl -X POST "https://quantenergx.com/api/v1/users/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","email":"test@test.com"}'

# Test rate limiting
for i in {1..100}; do
  curl "https://quantenergx.com/api/v1/users/auth/login" &
done
```

### 2. WAF Bypass Testing

```bash
# Test various encoding techniques
curl -X POST "https://quantenergx.com/api/test" \
  -d "param=%3Cscript%3Ealert(1)%3C/script%3E"

# Test double encoding
curl -X POST "https://quantenergx.com/api/test" \
  -d "param=%253Cscript%253E"
```

## Best Practices

1. **Defense in Depth**: Use multiple WAF layers (CDN, reverse proxy, application)
2. **Regular Updates**: Keep WAF rules and signatures updated
3. **Monitoring**: Continuously monitor WAF logs and metrics
4. **Testing**: Regularly test WAF effectiveness with security scans
5. **Tuning**: Fine-tune rules to minimize false positives
6. **Documentation**: Maintain documentation of custom rules and exceptions

## Maintenance

- **Weekly**: Review WAF logs and blocked requests
- **Monthly**: Update WAF rules and signatures
- **Quarterly**: Conduct penetration testing against WAF
- **Annually**: Review and update WAF architecture

---

**Note**: WAF configuration should be tailored to your specific deployment environment and requirements. Regular testing and monitoring are essential for effective protection.