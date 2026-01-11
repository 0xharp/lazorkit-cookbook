import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent build errors
      // The Marinade SDK's Anchor dependency tries to use 'fs' but we don't need it client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  // Turbopack-specific configuration
  turbopack: {
    resolveAlias: {
      // Prevent Node.js module resolution errors in browser
      fs: { browser: './empty-module.js' },
      path: { browser: './empty-module.js' },
      os: { browser: './empty-module.js' },
    },
  },
};

export default nextConfig;
