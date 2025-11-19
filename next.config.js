/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Ensure proper routing on Vercel
  trailingSlash: false,
  // Skip static optimization for pages that use client-side only features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Suppress warnings for optional dependencies
  webpack: (config, { isServer }) => {
    // Handle optional dependencies that aren't needed for web builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      }
    }
    
    // Suppress warnings for optional peer dependencies
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /pino/ },
      { message: /@react-native-async-storage/ },
      { message: /pino-pretty/ },
      { message: /Cannot find module for page/ },
    ]
    
    return config
  },
}

module.exports = nextConfig

