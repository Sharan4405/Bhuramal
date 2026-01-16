import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for faster development
  experimental: {
    optimizePackageImports: ['@/components'],
  },
  // Reduce compile overhead
  reactStrictMode: true,
};

export default nextConfig;
