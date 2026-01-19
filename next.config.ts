import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "logosandtypes.com",
      },
    ],
  },
  // Enable standalone output for Docker builds
  output: "standalone",

  // Proxy API requests to backend to avoid cross-origin cookie issues
  // This makes the browser think frontend and API are same-origin
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    // Extract base URL without the /api/v1 path
    const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },

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
