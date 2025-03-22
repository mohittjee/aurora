"use client";

import { Slider } from "@/components/ui/slider";
import { useAudioStore } from "@/store/audioStore";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  url: string;
}

export default function ProgressBar({ url }: ProgressBarProps) {
  const { currentTime, duration, isBuffering, seekTo } = useAudioStore();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (value: number[]) => {
    const seekToTime = (value[0] / 100) * duration;
    seekTo(seekToTime);
  };

  return (
    <div className="w-full flex items-center gap-2">
      {isBuffering && <Loader2 className="h-4 w-4 animate-spin" />}
      <Slider
        value={[progress]}
        max={100}
        step={0.1}
        onValueChange={handleSeek}
        disabled={isBuffering || !duration}
        className="flex-1"
      />
    </div>
  );
}