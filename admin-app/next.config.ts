import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io"
      },
      {
        protocol: "https",
        hostname: "files.microcms-assets.io"
      }
    ]
  }
};

export default nextConfig;
