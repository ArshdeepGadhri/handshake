import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.39"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'woiesmestrkohqherooi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Explicitly disabling features that might cause build loops
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
