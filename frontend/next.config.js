{
  "_comment": "QuantEnergX MVP - Next.js Configuration",
  "_copyright": "Copyright (c) 2025 QuantEnergX. All rights reserved.",
  "_patent": "Patent Pending - Energy Trading Platform Technology",
  "_confidential": "Confidential and Proprietary - SaaS Energy Trading Platform",
  
  "experimental": {
    "appDir": true
  },
  "reactStrictMode": true,
  "swcMinify": true,
  "i18n": {
    "locales": ["en", "ar", "fr", "es"],
    "defaultLocale": "en",
    "localeDetection": true
  },
  "images": {
    "domains": ["quantenergx.com", "cdn.quantenergx.com"],
    "unoptimized": false
  },
  "async redirects() {
    return [
      {
        "source": "/dashboard",
        "destination": "/dashboard/overview",
        "permanent": false
      }
    ]
  },
  "env": {
    "NEXT_PUBLIC_API_URL": "http://localhost:8000",
    "NEXT_PUBLIC_WS_URL": "ws://localhost:8000",
    "NEXT_PUBLIC_APP_NAME": "QuantEnergX MVP"
  },
  "webpack": "(config, { buildId, dev, isServer, defaultLoaders, webpack }) => {config.resolve.alias['@'] = path.join(__dirname, 'src'); return config;}"
}