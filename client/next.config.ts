import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for faster development
  experimental: {
    optimizePackageImports: ['@/components'],
  },
  // Reduce compile overhead
  reactStrictMode: true,
  // Enable faster refresh
  swcMinify: true,
};

export default nextConfig;
