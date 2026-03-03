import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'onlymatt-public-zone.b-cdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'onlymatt-media.b-cdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vz-c69f4e3f-963.b-cdn.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
