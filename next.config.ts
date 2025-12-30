import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
  // Allowlist dev origins (useful when tunneling with ngrok).
  // Set ALLOWED_DEV_ORIGINS in your environment to a comma-separated list
  // e.g. ALLOWED_DEV_ORIGINS="https://abcd.ngrok-free.dev,https://localhost:3000"
  allowedDevOrigins: [
    "https://localhost:3001",
    "https://127.0.0.1:3001",
    "https://192.168.133.153:3001",
    ...(process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      : []),
  ],
  /* config options here */
};

export default nextConfig;
