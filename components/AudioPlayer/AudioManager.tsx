"use client"

import { useRef, useEffect, useState } from "react"
import ReactPlayer from "react-player"
import { useAudioStore } from "@/store/audioStore"
import { toast } from "sonner"
import axios from "axios"
import type { MusicSnippet } from "@/types/music"

export default function AudioManager() {
  const {
    currentTrack,
    playing,
    setPlaying,
    playMode,
    queue,
    setCurrentTrack,
    currentTime,
    setCurrentTime,
    setDuration,
    setIsBuffering,
    volume,
    muted,
    seekTo,
  } = useAudioStore()
  const playerRef = useRef<ReactPlayer>(null)
  const trackCacheRef = useRef<Map<string, MusicSnippet>>(new Map())
  const [trackIndexMap] = useState<Map<string, number>>(new Map())

  // Fix for uploaded songs - handle different source types correctly
  const getPlayerUrl = () => {
    if (!currentTrack) return ""

    if (currentTrack.source === "upload") {
      // For uploaded songs, use the filePath directly
      return currentTrack.filePath || ""
    } else if (currentTrack.source === "youtube") {
      // For YouTube, construct the proper URL
      return `https://www.youtube.com/watch?v=${currentTrack.videoId}`
    } else {
      // For other sources, use videoId directly
      return currentTrack.videoId || ""
    }
  }

  const url = getPlayerUrl()

  // Find the current index in the queue, preserving original position
  const findCurrentIndex = () => {
    if (!currentTrack) return -1

    // First try to find by exact match
    const exactIndex = queue.findIndex((item) => {
      // Compare by videoId for streaming sources, by filePath for uploads
      if (currentTrack.source === "upload" && item.source === "upload") {
        return item.filePath === currentTrack.filePath
      }
      return item.videoId === currentTrack.videoId
    })

    if (exactIndex !== -1) return exactIndex

    // If not found, try to find by original track ID if available
    if (currentTrack.originalTrackId) {
      const originalIndex = trackIndexMap.get(currentTrack.originalTrackId)
      if (originalIndex !== undefined) return originalIndex
    }

    return -1
  }

  const currentIndex = findCurrentIndex()

  // Sync seekTo with playerRef
  useEffect(() => {
    const updateSeekTo = () => {
      useAudioStore.setState({
        seekTo: (time: number) => {
          if (playerRef.current) {
            playerRef.current.seekTo(time, "seconds")
            setCurrentTime(time)
          }
        },
      })
    }
    updateSeekTo()

    // Cleanup function to stop playback when unmounting
    return () => {
      if (playerRef.current) {
        // Force stop playback
        setPlaying(false)
      }
    }
  }, [setCurrentTime, setPlaying])

  useEffect(() => {
    if (playerRef.current) {
      const playerTime = playerRef.current.getCurrentTime()
      if (Math.abs(playerTime - currentTime) > 1) {
        playerRef.current.seekTo(currentTime, "seconds")
      }
    }
  }, [currentTime])

  // Update track index map when queue changes
  useEffect(() => {
    trackIndexMap.clear()
    queue.forEach((track, index) => {
      const trackId = getTrackUniqueId(track, index)
      trackIndexMap.set(trackId, index)
    })
  }, [queue, trackIndexMap])

  // Generate a unique ID for a track
  const getTrackUniqueId = (track: MusicSnippet, index: number): string => {
    if (track.source === "upload" && track.filePath) {
      return `upload-${track.filePath}`
    }

    if (track.videoId) {
      return `${track.source}-${track.videoId}`
    }

    return `${track.source}-${track.title}-${track.artist}-${index}`
  }

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  // Prefetch track data
  const prefetchTrack = async (track: MusicSnippet) => {
    if (!track || track.source === "upload") return track

    const cacheKey = `${track.source}-${track.title}-${track.artist}`
    if (trackCacheRef.current.has(cacheKey)) {
      return trackCacheRef.current.get(cacheKey) as MusicSnippet
    }

    try {
      const response = await axios.get("/api/track", {
        params: { title: track.title, artist: track.artist },
      })
      const updatedTrack: MusicSnippet = {
        ...response.data,
        // Preserve original data
        originalTitle: track.title,
        originalArtist: track.artist,
        originalThumbnail: track.thumbnails?.default?.url,
        originalTrackId: getTrackUniqueId(track, queue.indexOf(track)),
      }

      // Cache the result (max 15 items)
      trackCacheRef.current.set(cacheKey, updatedTrack)
      if (trackCacheRef.current.size > 15) {
        // Remove oldest entry (first key)
        const firstKey = trackCacheRef.current.keys().next().value
        if (firstKey) {
          trackCacheRef.current.delete(firstKey)
        }
      }

      return updatedTrack
    } catch (error) {
      console.error("Failed to prefetch track:", error)
      return track
    }
  }

  const getNextTrack = async () => {
    if (!queue.length) return null

    if (playMode === "single") {
      // Repeat the current track
      return currentTrack
    } else if (playMode === "shuffle") {
      // Play a random track from the queue
      const randomIndex = Math.floor(Math.random() * queue.length)
      const nextTrack = queue[randomIndex]
      return await prefetchTrack(nextTrack)
    } else if (currentIndex < queue.length - 1) {
      // Play the next track in the queue
      const nextTrack = queue[currentIndex + 1]
      return await prefetchTrack(nextTrack)
    } else if (playMode === "loop") {
      // Loop back to the first track
      const nextTrack = queue[0]
      return await prefetchTrack(nextTrack)
    }

    return null
  }

  // Prefetch tracks around the current track
  const preFetchTracks = async () => {
    if (playMode === "shuffle" || currentIndex === -1) return

    const prefetchRange = 2
    const start = Math.max(0, currentIndex - prefetchRange)
    const end = Math.min(queue.length - 1, currentIndex + prefetchRange)

    for (let i = start; i <= end; i++) {
      if (i !== currentIndex && queue[i].source !== "upload") {
        prefetchTrack(queue[i]).catch((err) => {
          console.error(`Error prefetching track at index ${i}:`, err)
        })
      }
    }
  }

  // Prefetch tracks when current track changes
  useEffect(() => {
    if (currentTrack && !playMode.includes("shuffle")) {
      preFetchTracks()
    }
  }, [currentTrack, playMode])

  const handleEnded = async () => {
    if (!queue.length) return

    try {
      if (playMode === "single") {
        // Repeat the current track
        playerRef.current?.seekTo(0)
        setPlaying(true)
        console.log("Repeating current track (single mode)")
      } else {
        // Get the next track based on play mode
        const nextTrack = await getNextTrack()

        if (nextTrack) {
          setCurrentTrack(nextTrack)
          setPlaying(true)
          console.log(`Playing next track: ${nextTrack.title}`)
        } else {
          // End of queue and not looping
          console.log("End of queue reached, stopping playback")
          setPlaying(false)
          toast.info("End of playlist reached")
        }
      }
    } catch (error) {
      console.error("Error handling track end:", error)
      toast.error("Error playing next track")
    }
  }

  const handleError = (e: any) => {
    console.error("ReactPlayer Error:", e)
    setPlaying(false)
    setIsBuffering(false)
    toast.error("Error playing track. Trying next track...")

    // If there's an error with the current track, try to play the next one
    getNextTrack()
      .then((nextTrack) => {
        if (nextTrack) {
          setTimeout(() => {
            setCurrentTrack(nextTrack)
            setPlaying(true)
          }, 1000) // Small delay before playing next track
        }
      })
      .catch((err) => {
        console.error("Error getting next track:", err)
      })
  }

  return (
    <div className="sr-only">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={muted ? 0 : volume / 100}
        muted={muted}
        controls={false}
        width="0px"
        height="0px"
        config={{
          youtube: {
            playerVars: { controls: 0, modestbranding: 1, fs: 0 },
          },
          file: {
            forceAudio: true,
            attributes: {
              crossOrigin: "anonymous",
            },
          },
        }}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onBuffer={() => setIsBuffering(true)}
        onBufferEnd={() => setIsBuffering(false)}
        onReady={() => setIsBuffering(false)}
        onError={handleError}
      />
    </div>
  )
}

