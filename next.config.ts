import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  basePath: '/warehouse',
  assetPrefix: '/warehouse',
};

export default nextConfig;
