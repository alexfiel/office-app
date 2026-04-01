import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Set this to your desired limit
    },
  },
  output: 'standalone',
};

export default nextConfig;

