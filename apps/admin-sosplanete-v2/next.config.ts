import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.83', 'localhost', '127.0.0.1'],
  /* config options here */
};

export default nextConfig;
