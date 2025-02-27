import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: false,
  images: {
    domains: [
      "i.ytimg.com", // YouTube thumbnails
      "i.scdn.co",   // Spotify images
      "yt3.ggpht.com",
      "image-cdn-ak.spotifycdn.com",
      "via.placeholder.com" 
    ],
  },
};

export default nextConfig;
