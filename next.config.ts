import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ["192.168.45.9", "localhost"],
  },
};

export default nextConfig;
