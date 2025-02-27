import "./globals.css";
import { ReactNode } from "react";
// import { AudioProvider } from "@/context/AudioContext";

export const metadata = {
  title: "YouTube Audio Player",
  description: "Play YouTube audio-only",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk.scdn.co/spotify-player.js" async />
      </head>
      <body>
        {/* <AudioProvider>{children}</AudioProvider> */}
        {children}
      </body>
    </html>
  );
}