import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker production build
  // Optimize for faster development
  experimental: {
    optimizePackageImports: ['@/components'],
  },
  // Reduce compile overhead
  reactStrictMode: true,
};

export default nextConfig;
