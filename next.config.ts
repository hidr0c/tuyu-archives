import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: "/tuyu-archives",
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable tracing which can cause permission issues on Windows
  generateEtags: false,
  // Avoid writing to .next/trace which often causes EPERM errors on Windows
  experimental: {
    // Reduce file system operations
    optimizePackageImports: ["react", "react-dom", "next"],
  },
};

export default nextConfig;
