import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "lh3.googleusercontent.com" }, // Google profile pictures
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Cloudinary image uploads
    },
  },
};

export default nextConfig;
