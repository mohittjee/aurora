"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Repeat1Icon as RepeatOne,
} from "lucide-react"
import { useAudioStore } from "@/store/audioStore"
import { useEffect } from "react"
import type { PlayMode } from "@/types/music"
import { toast } from "sonner"

export default function PlayerControls() {
  const {
    playing,
    setPlaying,
    currentTrack,
    queue,
    setCurrentTrack,
    playMode,
    setPlayMode,
    volume,
    setVolume,
    muted,
    setMuted,
  } = useAudioStore()

  const currentIndex = currentTrack
    ? queue.findIndex((item) => {
        if (currentTrack.source === "upload" && item.source === "upload") {
          return item.filePath === currentTrack.filePath
        }
        return item.videoId === currentTrack.videoId
      })
    : -1

  // Initialize volume to system volume if available
  useEffect(() => {
    if (typeof window !== "undefined" && "AudioContext" in window) {
      try {
        const audioContext = new AudioContext()
        audioContext.addEventListener("statechange", () => {
          if (audioContext.state === "running") {
            const analyser = audioContext.createAnalyser()
            const gainNode = audioContext.createGain()
            gainNode.connect(analyser)
            // Get the current system volume (approximation)
            const systemVolume = Math.round(gainNode.gain.value * 100)
            if (systemVolume > 0) {
              setVolume(systemVolume)
            }
          }
        })
        audioContext.resume()
      } catch (error) {
        // Fallback to default volume
      }
    }
  }, [setVolume])

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1])
      setPlaying(true)
    }
  }

  const handleNext = () => {
    if (playMode === "shuffle") {
      // Play a random track
      const randomIndex = Math.floor(Math.random() * queue.length)
      setCurrentTrack(queue[randomIndex])
      setPlaying(true)
      return
    }

    if (currentIndex < queue.length - 1) {
      setCurrentTrack(queue[currentIndex + 1])
      setPlaying(true)
    } else if (playMode === "loop") {
      // Loop back to the first track
      setCurrentTrack(queue[0])
      setPlaying(true)
    } else {
      // End of queue and not looping
      setPlaying(false)
      toast.info("End of playlist reached")
    }
  }

  const togglePlayMode = () => {
    const modes: PlayMode[] = ["normal", "shuffle", "single", "loop"]
    const currentModeIndex = modes.indexOf(playMode)
    const nextMode = modes[(currentModeIndex + 1) % modes.length]
    setPlayMode(nextMode)

    // Show toast with the new mode
    const modeMessages = {
      normal: "Normal playback",
      shuffle: "Shuffle playback",
      single: "Repeat current track",
      loop: "Loop playlist",
    }
    toast.info(modeMessages[nextMode])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (muted && value[0] > 0) setMuted(false)
  }

  const handleMuteToggle = () => {
    setMuted(!muted)
  }

  // Render the appropriate play mode icon
  const renderPlayModeIcon = () => {
    switch (playMode) {
      case "shuffle":
        return <Shuffle className="h-5 w-5" />
      case "single":
        return <RepeatOne className="h-5 w-5" />
      case "loop":
      case "normal":
      default:
        return <Repeat className="h-5 w-5" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={handlePrevious} disabled={currentIndex <= 0}>
        <SkipBack className="h-5 w-5" />
      </Button>
      <Button variant="ghost" onClick={handlePlayPause}>
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <Button
        variant="ghost"
        onClick={handleNext}
        disabled={currentIndex >= queue.length - 1 && playMode !== "loop" && playMode !== "shuffle"}
      >
        <SkipForward className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        onClick={togglePlayMode}
        title={`Play mode: ${playMode}`}
        className={playMode !== "normal" ? "text-blue-500" : ""}
      >
        {renderPlayModeIcon()}
      </Button>
      <Button variant="ghost" onClick={handleMuteToggle}>
        {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>
      <Slider value={[muted ? 0 : volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-24" />
    </div>
  )
}