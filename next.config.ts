import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/lessons/index.ts reads lesson JSON files from disk at runtime rather than
  // importing them, so a new lesson needs zero code changes — but that also means
  // Next's build-time file tracing can't see the dependency on its own; this tells the
  // lesson route to ship the whole content/lessons/data folder into the server bundle.
  outputFileTracingIncludes: {
    "/lessons/[slug]": ["./content/lessons/data/**/*.json"],
  },
  // Default 1MB is too small for homework-photo uploads (startHelpSession passes
  // base64 image data straight through as a Server Action argument).
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
