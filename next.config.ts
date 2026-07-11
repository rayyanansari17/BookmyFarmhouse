import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "lh5.googleusercontent.com" },
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
};

export default nextConfig;
