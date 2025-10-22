import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
    formats: ["image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@tanstack/react-query",
    ],
  },
  compress: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude native modules from webpack bundling
      config.externals = config.externals || [];
      config.externals.push({
        canvas: "commonjs canvas",
        "pdf-parse": "commonjs pdf-parse",
      });
    }

    // Handle PDF-related modules
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Ignore warnings for specific modules
    config.ignoreWarnings = [
      { module: /node_modules\/pdf-parse/ },
      { module: /node_modules\/tesseract\.js/ },
    ];

    return config;
  },
};

export default nextConfig;
