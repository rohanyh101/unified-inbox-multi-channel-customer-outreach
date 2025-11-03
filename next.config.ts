import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Image optimization with remotePatterns (replaces domains)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.twilio.com',
      },
    ],
  },

  // Turbopack configuration (replaces webpack config)
  turbopack: {
    // Empty config to silence the warning
    // Turbopack handles most optimizations automatically
  },
};

export default nextConfig;
