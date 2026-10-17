import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "*.googleusercontent.com" },
      { hostname: "maps.googleapis.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "images.pexels.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Cloudinary image uploads
    },
  },
  async redirects() {
    // No public site: the root goes to the vendor login (admins use /admin/login).
    return [{ source: "/", destination: "/vendor/login", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
