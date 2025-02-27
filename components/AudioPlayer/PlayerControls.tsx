"use client";

import { useAudioStore } from "@/store/audioStore";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";

export default function PlayerControls() {
  const { queue, currentTrack, playing, setPlaying, playMode, setPlayMode, setCurrentTrack } = useAudioStore();

  const currentIndex = currentTrack
    ? queue.findIndex(
        (item) =>
          (item.id?.videoId || item.snippet.resourceId?.videoId) ===
          (currentTrack.id?.videoId || currentTrack.snippet.resourceId?.videoId)
      )
    : -1;

  const handleNext = () => {
    if (queue.length === 0) return;
    let nextIndex: number;
    if (playMode === "shuffle") {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (currentIndex < queue.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (playMode === "loop") {
      nextIndex = 0;
    } else {
      return; // No next track
    }
    setCurrentTrack(queue[nextIndex]);
    setPlaying(true);
  };

  const handleBack = () => {
    if (queue.length === 0) return;
    let prevIndex: number;
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else if (playMode === "loop") {
      prevIndex = queue.length - 1;
    } else {
      return; // No previous track
    }
    setCurrentTrack(queue[prevIndex]);
    setPlaying(true);
  };

  const togglePlayMode = () => {
    const modes = ["normal", "shuffle", "single", "loop"] as const;
    const currentModeIndex = modes.indexOf(playMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setPlayMode(nextMode);
  };

  const modeIcon = playMode === "shuffle" ? <Shuffle className="h-4 w-4" /> : <Repeat className="h-4 w-4" />;

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleBack}
        disabled={queue.length === 0 || (currentIndex <= 0 && playMode !== "loop")}
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPlaying(!playing)}
        disabled={!currentTrack}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={queue.length === 0 || (currentIndex >= queue.length - 1 && playMode !== "loop")}
      >
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button
        variant={playMode === "normal" ? "ghost" : "outline"}
        size="icon"
        onClick={togglePlayMode}
        title={playMode}
      >
        {playMode === "normal" ? <Shuffle className="h-4 w-4 opacity-50" /> : modeIcon}
      </Button>
    </div>
  );
}