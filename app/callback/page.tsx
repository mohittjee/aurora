"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAudioStore } from "@/store/audioStore";

export default function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSpotifyAccessToken } = useAudioStore();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Spotify Callback Error:", error);
      router.push("/?error=auth_failed"); // Client-side redirect
      return;
    }

    if (code) {
      fetch(`/api/spotify-auth?code=${code}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.accessToken) {
            console.log("Callback - Setting Access Token:", data.accessToken);
            setSpotifyAccessToken(data.accessToken);
            router.push("/", { scroll: false }); // Client-side, no reset
          } else {
            console.error("Callback - No Access Token:", data);
            router.push("/?error=token_failed");
          }
        })
        .catch((error) => {
          console.error("Callback Fetch Error:", error);
          router.push("/?error=fetch_failed");
        });
    }
  }, [searchParams, setSpotifyAccessToken, router]);

  return <div>Authenticating with Spotify...</div>;
}