import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['xlsx'],
  outputFileTracingIncludes: {
    '/api/data': ['./data/**/*'],
  },
};

export default nextConfig;
