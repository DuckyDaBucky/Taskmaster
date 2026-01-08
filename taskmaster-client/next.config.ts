import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Speed up dev builds
  reactStrictMode: false,
  poweredByHeader: false,
};

export default nextConfig;
