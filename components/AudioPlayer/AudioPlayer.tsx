"use client"

import { useEffect } from "react"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useAudioStore } from "@/store/audioStore"
import PlayerControls from "./PlayerControls"
import ProgressBar from "./ProgressBar"
import DownloadButton from "@/components/DownloadButton"
import { Maximize2, Minimize2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createRoot } from "react-dom/client"
import AudioManager from "./AudioManager"
import { useUser } from "@clerk/nextjs"
import axios from "axios"
import { toast } from "sonner"
import { AuthDialog } from "@/components/ui/auth-dialog"

interface PiPPlayerProps {
  onClose: () => void
  volume: number
  muted: boolean
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
}

const PiPPlayer: React.FC<PiPPlayerProps> = ({ onClose, volume, muted, setVolume, setMuted }) => {
  const { currentTrack, currentTime, duration } = useAudioStore()

  if (!currentTrack) return null

  // Fix for handling different source types
  const getUrl = () => {
    if (currentTrack.source === "upload") {
      return currentTrack.filePath || ""
    } else if (currentTrack.source === "youtube") {
      return `https://www.youtube.com/watch?v=${currentTrack.videoId}`
    } else {
      return currentTrack.videoId || ""
    }
  }

  const url = getUrl()

  // Use original thumbnail if available
  const thumbnailUrl =
    currentTrack.originalThumbnail || currentTrack.thumbnails?.default?.url || "https://placehold.co/120"

  return (
    <div className="p-4 flex items-center gap-4 bg-gray-100">
      <Image
        src={thumbnailUrl || "/placeholder.svg?height=48&width=48"}
        alt="Cover"
        width={48}
        height={48}
        className="rounded"
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{currentTrack.originalTitle || currentTrack.title}</p>
        <p className="text-xs text-gray-600">{currentTrack.originalArtist || currentTrack.artist}</p>
      </div>
      <PlayerControls />
      <div className="flex items-center gap-2 w-64">
        <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
        <ProgressBar url={url} />
        <span className="text-sm text-gray-600">{formatTime(duration)}</span>
      </div>
      <DownloadButton trackId={`${currentTrack.title}-${currentTrack.artist}`} source={currentTrack.source} />
      <Button variant="ghost" onClick={onClose}>
        <Maximize2 className="h-5 w-5" />
      </Button>
    </div>
  )
}

export default function AudioPlayer() {
  const { currentTrack, currentTime, duration, volume, setVolume, muted, setMuted } = useAudioStore()
  const [pipActive, setPipActive] = useState(false)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isSignedIn } = useUser()
  const [likedSongs, setLikedSongs] = useState<any[]>([])
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Fix for handling different source types
  const getUrl = () => {
    if (!currentTrack) return ""

    if (currentTrack.source === "upload") {
      return currentTrack.filePath || ""
    } else if (currentTrack.source === "youtube") {
      return `https://www.youtube.com/watch?v=${currentTrack.videoId}`
    } else {
      return currentTrack.videoId || ""
    }
  }

  const url = getUrl()

  // Use original thumbnail if available
  const thumbnailUrl =
    currentTrack?.originalThumbnail || currentTrack?.thumbnails?.default?.url || "https://placehold.co/120"

  // Rest of the component...

  const togglePiP = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) e.stopPropagation() // Prevent card click from interfering
      if (pipActive) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else if (pipWindow) {
          pipWindow.close()
        }
        setPipActive(false)
        setPipWindow(null)
      } else {
        if ("documentPictureInPicture" in window) {
          try {
            const pipWin = await (window as any).documentPictureInPicture.requestWindow({
              width: 600,
              height: 100,
            })
            setPipWindow(pipWin)

            // Copy styles to PiP window
            const styles = Array.from(document.styleSheets).map((styleSheet) => {
              try {
                return Array.from(styleSheet.cssRules)
                  .map((rule) => rule.cssText)
                  .join("")
              } catch (e) {
                const link = document.createElement("link")
                link.rel = "stylesheet"
                link.type = styleSheet.type
                if (styleSheet.media) {
                  link.media = styleSheet.media.mediaText
                }
                link.href = styleSheet.href!
                return link
              }
            })

            styles.forEach((style) => {
              if (typeof style === "string") {
                const styleElement = pipWin.document.createElement("style")
                styleElement.textContent = style
                pipWin.document.head.appendChild(styleElement)
              } else if (style instanceof HTMLLinkElement) {
                pipWin.document.head.appendChild(style.cloneNode())
              }
            })

            // Render PiP content
            const root = pipWin.document.createElement("div")
            pipWin.document.body.appendChild(root)
            const pipRoot = createRoot(root)
            pipRoot.render(
              <PiPPlayer
                onClose={() => {
                  pipWin.close()
                  setPipActive(false)
                }}
                volume={volume}
                muted={muted}
                setVolume={setVolume}
                setMuted={setMuted}
              />,
            )

            pipWin.addEventListener("pagehide", () => {
              pipRoot.unmount()
              setPipActive(false)
              setPipWindow(null)
            })

            setPipActive(true)
          } catch (error) {
            toast.error("Failed to enter Picture-in-Picture mode")
          }
        } else if (document.pictureInPictureEnabled && videoRef.current) {
          try {
            await videoRef.current.requestPictureInPicture()
            setPipActive(true)
          } catch (error) {
            toast.error("Failed to enter Picture-in-Picture mode")
          }
        }
      }
    },
    [pipActive, currentTrack, volume, muted, setVolume, setMuted],
  )

  // Fetch liked songs
  useEffect(() => {
    if (isSignedIn) {
      axios
        .get("/api/likes")
        .then((res) => {
          setLikedSongs(res.data)
        })
        .catch(() => {
          toast.error("Failed to fetch liked songs")
        })
    }
  }, [isSignedIn])

  const isLiked =
    currentTrack &&
    likedSongs.some(
      (song) =>
        (song.videoId && song.videoId === currentTrack.videoId) ||
        (song.filePath && song.filePath === currentTrack.filePath),
    )

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!currentTrack) return

    if (!isSignedIn) {
      setShowAuthDialog(true)
      return
    }

    try {
      // Optimistically update UI
      const wasLiked = isLiked
      if (!wasLiked) {
        setLikedSongs((prev) => [...prev, currentTrack])
      }

      const response = await axios.post("/api/likes", { track: currentTrack })
      if (response.data.success) {
        if (!wasLiked) {
          toast.success("Song liked!")
        }
      }
    } catch (error: any) {
      // Revert optimistic update
      if (error.response?.status === 409) {
        toast.info("Song already liked")
      } else {
        toast.error("Failed to like song")
        setLikedSongs((prev) =>
          prev.filter((song) => song.videoId !== currentTrack.videoId && song.filePath !== currentTrack.filePath),
        )
      }
    }
  }

  if (!currentTrack) return null

  if (!url) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4 shadow-lg">
        <Image
          src={thumbnailUrl || "/placeholder.svg?height=48&width=48"}
          alt="Cover"
          width={48}
          height={48}
          className="rounded"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{currentTrack.originalTitle || currentTrack.title}</p>
          <p className="text-xs text-gray-600">{currentTrack.originalArtist || currentTrack.artist}</p>
          <p className="text-xs text-red-600">No playable URL found</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t p-4 flex items-center gap-4 shadow-lg">
        <Image
          src={thumbnailUrl || "/placeholder.svg?height=48&width=48"}
          alt="Cover"
          width={48}
          height={48}
          className="rounded"
        />
        <div className="flex-1">
          <p className="text-sm font-medium">{currentTrack.originalTitle || currentTrack.title}</p>
          <p className="text-xs text-gray-600">{currentTrack.originalArtist || currentTrack.artist}</p>
        </div>
        <PlayerControls />
        <div className="flex items-center gap-2 w-64">
          <span className="text-sm text-gray-600">{formatTime(currentTime)}</span>
          <ProgressBar url={url} />
          <span className="text-sm text-gray-600">{formatTime(duration)}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLike} className="text-gray-600" title="Like song">
          <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
        <DownloadButton trackId={`${currentTrack.title}-${currentTrack.artist}`} source={currentTrack.source} />
        <Button variant="ghost" onClick={togglePiP}>
          {pipActive ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
        </Button>
        <video ref={videoRef} style={{ display: "none" }} />
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        title="Authentication Required"
        description="You need to be logged in to like songs. Would you like to sign in now?"
        actionType="like"
        onComplete={() => setShowAuthDialog(false)}
      />

      {/* Single AudioManager instance */}
      {currentTrack && <AudioManager />}
    </>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs < 10 ? "0" + secs : secs}`
}