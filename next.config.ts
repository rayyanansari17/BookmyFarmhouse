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
  async rewrites() {
    return [
      // /farmhouses-in-hyderabad → internal /city/hyderabad (SSR city hub page)
      { source: "/farmhouses-in-:city", destination: "/city/:city" },
    ];
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
