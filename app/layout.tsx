"use client";

import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { ReactNode } from "react";
// import { AudioProvider } from "@/context/AudioContext";

// export const metadata = {
//   title: "YouTube Audio Player",
//   description: "Play YouTube audio-only",
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* <AudioProvider>{children}</AudioProvider> */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}