import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'books.toscrape.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],
  experimental: {
    // This helps with some WebSocket issues in dev mode
  },
  turbopack: {
    // Silences the error for custom webpack config or experimental features
  },
};

export default nextConfig;
