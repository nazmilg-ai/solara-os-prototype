import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Admin > Import "Full Data Refresh" button reads the CSVs at the
  // repo root via fs at runtime. Next.js only bundles files it can trace
  // from imports, so the CSVs need to be listed explicitly or they won't
  // exist in the deployed serverless function.
  outputFileTracingIncludes: {
    "/admin/import": ["./*.csv"],
    // Fallback in case the route-specific key above doesn't match how this
    // route's trace group is identified — cheap insurance, ~7MB total.
    "/**": ["./*.csv"],
  },
};

export default nextConfig;
