import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? "/bassic" : "",
  assetPrefix: isGithubPages ? "/bassic/" : undefined,
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
