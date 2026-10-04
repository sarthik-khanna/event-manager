import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Admins can paste any HTTPS thumbnail URL.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
