import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    typedRoutes: true
  },

  serverExternalPackages: ["pg"],

  eslint: {
    ignoreDuringBuilds: false
  },

  typescript: {
    ignoreBuildErrors: false
  }
};

export default nextConfig;