import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['prod.spline.design'], // Allow Spline assets
  },
  // Disable strict mode for Spline compatibility
  reactStrictMode: false,
};

export default nextConfig;