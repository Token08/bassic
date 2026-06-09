import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io"
      },
      {
        protocol: "https",
        hostname: "www.bassic.jp"
      }
    ]
  }
};

export default nextConfig;
