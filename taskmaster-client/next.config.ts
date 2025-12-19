import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the multiple lockfile warning
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
