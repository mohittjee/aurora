"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAudioStore } from "@/store/audioStore";
import PlayerControls from "./PlayerControls";
import ProgressBar from "./ProgressBar";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
};

export default function AudioPlayer() {
  const { currentTrack, playing, setPlaying, spotifyAccessToken } = useAudioStore();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [sdkReady, setSdkReady] = useState<boolean>(false);

  useEffect(() => {
    if (!spotifyAccessToken || spotifyPlayer || typeof window === "undefined" || !window.Spotify) {
      console.log("Skipping SDK init:", { hasToken: !!spotifyAccessToken, hasPlayer: !!spotifyPlayer, hasSpotify: typeof window !== "undefined" && !!window.Spotify });
      return;
    }

    console.log("Initializing Spotify Player with Token:", spotifyAccessToken);

    const player = new window.Spotify.Player({
      name: "Next.js Music Player",
      getOAuthToken: (cb: (token: string) => void) => {
        console.log("Providing OAuth Token:", spotifyAccessToken);
        cb(spotifyAccessToken);
      },
      volume: 0.5,
    });

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      console.log("Spotify Player Ready with Device ID:", device_id);
      setSpotifyPlayer(player);
      setSdkReady(true);
    });

    player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
      console.log("Spotify Player Not Ready, Device ID:", device_id);
      setSdkReady(false);
    });

    player.addListener("player_state_changed", (state: any) => {
      if (state) {
        console.log("Player State Changed:", state);
        setCurrentTime(state.position / 1000);
        setDuration(state.duration / 1000);
        setPlaying(!state.paused);
      }
    });

    player.addListener("initialization_error", ({ message }: { message: string }) => {
      console.error("Spotify SDK Initialization Error:", message);
    });

    player.addListener("authentication_error", ({ message }: { message: string }) => {
      console.error("Spotify SDK Authentication Error:", message);
    });

    player.addListener("account_error", ({ message }: { message: string }) => {
      console.error("Spotify SDK Account Error:", message);
    });

    player.connect().then((success: boolean) => {
      console.log("Spotify Player Connect Success:", success);
    }).catch((error: any) => {
      console.error("Spotify Player Connect Error:", error);
    });

    return () => {
      console.log("Disconnecting Spotify Player");
      player.disconnect();
    };
  }, [spotifyAccessToken, spotifyPlayer]);

  useEffect(() => {
    if (spotifyPlayer && sdkReady && currentTrack?.snippet.source === "spotify" && playing) {
      console.log("Attempting to play Spotify track:", currentTrack.snippet.trackId);
      spotifyPlayer
        .play({
          uris: [`spotify:track:${currentTrack.snippet.trackId}`],
        })
        .catch((error: any) => {
          console.error("Spotify Play Error:", error);
        });
    } else if (spotifyPlayer && sdkReady && currentTrack?.snippet.source === "spotify" && !playing) {
      console.log("Pausing Spotify track");
      spotifyPlayer.pause().catch((error: any) => {
        console.error("Spotify Pause Error:", error);
      });
    }
  }, [currentTrack, playing, spotifyPlayer, sdkReady]);

  if (!currentTrack) return null;

  const url =
    currentTrack.snippet.source === "spotify" && currentTrack.snippet.previewUrl
      ? currentTrack.snippet.previewUrl
      : currentTrack.snippet.source !== "spotify" && currentTrack.snippet.videoId
      ? `https://www.youtube.com/watch?v=${currentTrack.snippet.videoId}`
      : null;

  console.log("Audio Player Current Track:", JSON.stringify(currentTrack, null, 2));
  console.log("Audio Player URL:", url);
  console.log("Spotify Player Status:", { ready: sdkReady, player: !!spotifyPlayer });

  if (!url && currentTrack.snippet.source !== "spotify") {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4">
        <Image
          src={currentTrack.snippet.thumbnails.default.url}
          alt="Cover"
          width={48}
          height={48}
          className="rounded"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{currentTrack.snippet.title}</p>
          <p className="text-xs text-gray-600">{currentTrack.snippet.artist}</p>
          <p className="text-xs text-red-600">No playable URL available</p>
        </div>
      </div>
    );
  }

  if (currentTrack.snippet.source === "spotify" && !spotifyAccessToken) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4">
        <Image
          src={currentTrack.snippet.thumbnails.default.url}
          alt="Cover"
          width={48}
          height={48}
          className="rounded"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{currentTrack.snippet.title}</p>
          <p className="text-xs text-gray-600">{currentTrack.snippet.artist}</p>
          <a href="/api/spotify-auth" className="text-xs text-blue-600 hover:underline">
            Login with Spotify to play full tracks
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4">
      <Image
        src={currentTrack.snippet.thumbnails.default.url}
        alt="Cover"
        width={48}
        height={48}
        className="rounded"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{currentTrack.snippet.title}</p>
        <p className="text-xs text-gray-600">{currentTrack.snippet.artist}</p>
      </div>
      <PlayerControls />
      {currentTrack.snippet.source !== "spotify" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
          <ProgressBar
            url={url!}
            onProgress={(playedSeconds) => setCurrentTime(playedSeconds)}
            onDuration={(duration) => setDuration(duration)}
          />
          <span className="text-sm text-gray-600">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}