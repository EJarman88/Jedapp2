import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/lessons, content/practice, and content/remediation all read their JSON
  // files from disk at runtime rather than importing them, so adding new content is
  // zero code changes — but that also means Next's build-time file tracing can't see
  // the dependency on its own; this tells each dependent route to ship the relevant
  // content/**/data folder into the server bundle.
  outputFileTracingIncludes: {
    "/lessons/[slug]": ["./content/lessons/data/**/*.json"],
    "/practice": ["./content/practice/data/**/*.json", "./content/remediation/data/**/*.json"],
  },
};

export default nextConfig;
