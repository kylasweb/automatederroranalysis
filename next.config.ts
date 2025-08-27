import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },

  // React strict mode for better development
  reactStrictMode: true,

  // Webpack configuration for serverless
  webpack: (config, { dev }) => {
    if (dev) {
      // Development-specific webpack config
      config.watchOptions = {
        ignored: ['**/*'], // Ignore file changes (handled by nodemon)
      };
    }

    return config;
  },

  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },

  // Enable external packages for server components
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

export default nextConfig;
