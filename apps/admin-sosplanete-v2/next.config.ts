import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.83', 'localhost', '127.0.0.1'],
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011'}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
