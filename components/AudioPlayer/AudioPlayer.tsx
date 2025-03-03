"use client";

import { useState } from "react";
import Image from "next/image";
import { useAudioStore } from "@/store/audioStore";
import PlayerControls from "./PlayerControls";
import ProgressBar from "./ProgressBar";
import DownloadButton from "@/components/DownloadButton";

export default function AudioPlayer() {
  const { currentTrack } = useAudioStore();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  if (!currentTrack) return null;

  const url = currentTrack.videoId || "";

  if (!url) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4 shadow-lg">
        <Image
          src={currentTrack.thumbnails.default.url}
          alt="Cover"
          width={48}
          height={48}
          className="rounded"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{currentTrack.title}</p>
          <p className="text-xs text-gray-600">{currentTrack.artist}</p>
          <p className="text-xs text-red-600">No playable URL found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4 shadow-lg">
      <Image
        src={currentTrack.thumbnails.default.url}
        alt="Cover"
        width={48}
        height={48}
        className="rounded"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{currentTrack.title}</p>
        <p className="text-xs text-gray-600">{currentTrack.artist}</p>
      </div>
      <PlayerControls />
      <div className="flex items-center gap-2 w-64">
        <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
        <ProgressBar
          url={url}
          onProgress={(playedSeconds) => setCurrentTime(playedSeconds)}
          onDuration={(duration) => setDuration(duration)}
        />
        <span className="text-sm text-gray-600">{formatTime(duration)}</span>
      </div>
      <DownloadButton trackId={`${currentTrack.title}-${currentTrack.artist}`} source={currentTrack.source} />
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
}