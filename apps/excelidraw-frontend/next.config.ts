import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure shared UI package is transpiled so Tailwind v4 picks up its classes
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
