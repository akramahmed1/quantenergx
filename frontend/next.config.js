/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Public runtime config for client-side access
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'QuantEnergx',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config can be added here if needed
    return config;
  },
  
  // Build optimization
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Output configuration for static export if needed
  trailingSlash: false,
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
};

module.exports = nextConfig;