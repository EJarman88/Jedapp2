import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/lessons and content/extended-response both read their JSON files from disk
  // at runtime rather than importing them, so adding content is zero code changes —
  // but that also means Next's build-time file tracing can't see the dependency on its
  // own; this tells each dependent route to ship the relevant content/**/data folder
  // into the server bundle.
  outputFileTracingIncludes: {
    "/lessons/[slug]": ["./content/lessons/data/**/*.json"],
    "/practice/extended-response": ["./content/extended-response/data/**/*.json"],
    "/review/[token]": ["./content/extended-response/data/**/*.json"],
  },
};

export default nextConfig;
