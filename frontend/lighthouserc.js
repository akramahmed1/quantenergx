{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/trading",
        "http://localhost:3000/portfolio",
        "http://localhost:3000/market"
      ],
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "Local:",
      "startServerReadyTimeout": 30000,
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1,
          "requestLatencyMs": 0,
          "downloadThroughputKbps": 0,
          "uploadThroughputKbps": 0
        },
        "formFactor": "desktop",
        "screenEmulation": {
          "mobile": false,
          "width": 1920,
          "height": 1080,
          "deviceScaleFactor": 1,
          "disabled": false
        }
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.8}],
        "categories:pwa": ["warn", {"minScore": 0.6}],
        
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}],
        "speed-index": ["error", {"maxNumericValue": 3000}],
        
        "uses-responsive-images": "warn",
        "offscreen-images": "warn",
        "render-blocking-resources": "warn",
        "unused-css-rules": "warn",
        "unused-javascript": "warn",
        "modern-image-formats": "warn",
        "efficiently-encode-images": "warn",
        "uses-webp-images": "warn",
        
        "interactive": ["error", {"maxNumericValue": 3500}],
        "max-potential-fid": ["error", {"maxNumericValue": 130}],
        
        "uses-long-cache-ttl": "warn",
        "uses-optimized-images": "warn",
        "uses-text-compression": "warn",
        "server-response-time": ["error", {"maxNumericValue": 600}],
        
        "color-contrast": "error",
        "image-alt": "error",
        "label": "error",
        "link-name": "error",
        "button-name": "error",
        
        "is-on-https": "error",
        "uses-http2": "warn",
        "no-vulnerable-libraries": "error"
      }
    },
    "upload": {
      "target": "temporary-public-storage",
      "reportFilenamePattern": "%%PATHNAME%%-%%DATETIME%%-lighthouse-report.%%EXTENSION%%"
    },
    "server": {
      "port": 9001,
      "storage": "./lighthouse-reports"
    }
  }
}