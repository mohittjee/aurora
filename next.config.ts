import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    domains: [
      "via.placeholder.com",
      "placehold.com",
      "placehold.co"
    ],
    remotePatterns: [
      // JioSaavn
      {
        protocol: 'https',
        hostname: '**.saavncdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.jiosaavn.com',
      },
      // Spotify
      {
        protocol: 'https',
        hostname: '**.scdn.co',
      },
      {
        protocol: 'https',
        hostname: '**.spotifycdn.com',
      },
      // YouTube
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: "https",
        hostname: "**.ggpht.com",
      },
    ],
  },
};

export default nextConfig;
