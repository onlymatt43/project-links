import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.bunnycdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
