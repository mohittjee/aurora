"use client";

import { useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Slider } from "@/components/ui/slider";
import { useAudioStore } from "@/store/audioStore";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  url: string;
  onProgress?: (playedSeconds: number) => void;
  onDuration?: (duration: number) => void;
}

export default function ProgressBar({ url, onProgress, onDuration }: ProgressBarProps) {
  const { queue, currentTrack, setCurrentTrack, playing, setPlaying, playMode } = useAudioStore();
  const [progress, setProgress] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const playerRef = useRef<ReactPlayer>(null);

  const currentIndex = currentTrack
    ? queue.findIndex(
        (item) =>
          (item.videoId || item.trackId) === (currentTrack.videoId || currentTrack.trackId)
      )
    : -1;

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played * 100);
    if (onProgress) onProgress(state.playedSeconds);
  };

  const handleSeek = (value: number[]) => {
    const seekTo = value[0] / 100;
    if (playerRef.current) {
      playerRef.current.seekTo(seekTo, "fraction");
      setProgress(value[0]);
    }
  };

  const handleDuration = (duration: number) => {
    if (onDuration) onDuration(duration);
  };

  const handleEnded = () => {
    if (!queue.length) return;
    if (playMode === "single") {
      playerRef.current?.seekTo(0);
      setPlaying(true);
    } else if (playMode === "shuffle") {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentTrack(queue[randomIndex]);
      setPlaying(true);
    } else if (currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1]);
      setPlaying(true);
    } else if (playMode === "loop") {
      setCurrentTrack(queue[0]);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  return (
    <div className="w-64 flex items-center gap-2">
      {isBuffering && <Loader2 className="h-4 w-4 animate-spin" />}
      <Slider
        value={[progress]}
        max={100}
        step={0.1}
        onValueChange={handleSeek}
        disabled={isBuffering || !currentTrack}
      />
      <div className="sr-only">
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          controls={false}
          width="0px"
          height="0px"
          config={{ youtube: { playerVars: { controls: 0, modestbranding: 1, fs: 0 } } }}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onBuffer={() => setIsBuffering(true)}
          onBufferEnd={() => setIsBuffering(false)}
          onReady={() => setIsBuffering(false)}
        />
      </div>
    </div>
  );
}