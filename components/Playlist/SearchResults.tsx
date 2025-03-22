"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useAudioStore } from "@/store/audioStore"
import type { MusicSnippet } from "@/types/music"
import { Loader2, Heart, Check, Save, PlayCircle, Play, ExternalLink } from "lucide-react"
import axios from "axios"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AuthDialog } from "@/components/ui/auth-dialog"

interface SearchResultsProps {
  loadMore: (query: string) => void
  initialQuery: string
}

// Improve the LRU cache implementation
class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, V>

  constructor(maxSize: number) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to the end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    // If key exists, delete it first
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // If cache is full, delete oldest item
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        console.log(`LRU Cache: Removing oldest item ${String(oldestKey)}`)
        this.cache.delete(oldestKey)
      }
    }
    // Add new item
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  size(): number {
    return this.cache.size
  }

  clear(): void {
    this.cache.clear()
  }
}

export default function SearchResults({ loadMore, initialQuery }: SearchResultsProps) {
  const { user, isSignedIn } = useUser()
  const {
    searchResults,
    setSearchResults,
    setCurrentTrack,
    setQueue,
    setPlaying,
    loading,
    playlistMetadata,
    error,
    hasMore,
    totalTracks,
    currentTrack,
    playMode,
    searchStage: globalSearchStage,
  } = useAudioStore()
  const [durations, setDurations] = useState<Record<string, number>>({})
  const [trackCache] = useState<LRUCache<string, MusicSnippet>>(() => new LRUCache(15))
  const [likedSongs, setLikedSongs] = useState<MusicSnippet[]>([])
  const [savedPlaylists, setSavedPlaylists] = useState<string[]>([])
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [pendingLikeTrack, setPendingLikeTrack] = useState<MusicSnippet | null>(null)
  const [localSearchStage, setLocalSearchStage] = useState<string | null>(null)

  // Track index map to preserve original positions
  const trackIndexMapRef = useRef<Map<string, number>>(new Map())

  // Generate a truly unique ID for each track
  const getTrackUniqueId = (track: MusicSnippet, index: number): string => {
    // Use a combination of properties to create a unique ID
    if (track.source === "upload" && track.filePath) {
      return `upload-${track.filePath}`
    }

    if (track.videoId) {
      return `${track.source}-${track.videoId}`
    }

    // Fallback to a combination of title, artist, source and index
    return `${track.source}-${track.title}-${track.artist}-${index}`
  }

  const fetchDurations = async (tracks: MusicSnippet[]) => {
    const durationMap: Record<string, number> = {}
    const uncachedVideoIds = tracks
      .filter((t) => t.videoId && t.source === "youtube" && !durations[t.videoId])
      .map((t) => t.videoId!)

    if (uncachedVideoIds.length > 0) {
      try {
        const ytResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            part: "contentDetails",
            id: uncachedVideoIds.join(","),
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          },
        })
        ytResponse.data.items.forEach((item: any) => {
          const match = item.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
          const hours = Number.parseInt(match?.[1] || "0") * 3600
          const minutes = Number.parseInt(match?.[2] || "0") * 60
          const seconds = Number.parseInt(match?.[3] || "0")
          durationMap[item.id] = hours + minutes + seconds
        })
      } catch (error) {
        const errorObj = error as Error
        toast.error(`YouTube Duration Fetch Error: ${errorObj.message}`)
      }
    }
    setDurations((prev) => ({ ...prev, ...durationMap }))
  }

  const fetchTrackData = async (track: MusicSnippet, index: number): Promise<MusicSnippet> => {
    // Skip fetching for uploaded songs
    if (track.source === "upload") {
      return track
    }

    // Create a unique cache key that includes the source
    const cacheKey = `${track.source}-${track.title}-${track.artist}`
    const cachedTrack = trackCache.get(cacheKey)
    if (cachedTrack) {
      console.log(`Cache hit for track: ${track.title} by ${track.artist}`)

      // Store the original index for this track
      const trackId = getTrackUniqueId(cachedTrack, index)
      if (!trackIndexMapRef.current.has(trackId)) {
        trackIndexMapRef.current.set(trackId, index)
      }

      return cachedTrack
    }

    console.log(`Fetching track data for: ${track.title} by ${track.artist}`)
    try {
      setLocalSearchStage("Fetching track...")
      const response = await axios.get("/api/track", {
        params: { title: track.title, artist: track.artist },
      })

      // Create updated track with original data preserved
      const updatedTrack: MusicSnippet = {
        ...response.data,
        originalTitle: track.title,
        originalArtist: track.artist,
        originalThumbnail: track.thumbnails?.default?.url,
        originalTrackId: getTrackUniqueId(track, index),
      }

      trackCache.set(cacheKey, updatedTrack)
      console.log(`LRU Cache size: ${trackCache.size()}`)

      // Store the original index for this track
      const trackId = getTrackUniqueId(updatedTrack, index)
      if (!trackIndexMapRef.current.has(trackId)) {
        trackIndexMapRef.current.set(trackId, index)
      }

      setLocalSearchStage(null)
      return updatedTrack
    } catch (error) {
      console.error("Failed to fetch track data:", error)
      toast.error("Failed to fetch track data")
      setLocalSearchStage(null)
      return track
    }
  }

  const preFetchTracks = async (index: number) => {
    // Don't prefetch in shuffle mode
    if (playMode === "shuffle") {
      console.log("Skipping prefetch in shuffle mode")
      return
    }

    const prefetchRange = 2 // Prefetch 2 tracks before and after
    const start = Math.max(0, index - prefetchRange)
    const end = Math.min(searchResults.length - 1, index + prefetchRange)

    console.log(`Prefetching tracks from index ${start} to ${end}`)

    // Create a copy of the results to update
    const updatedResults = [...searchResults]

    // Create an array of promises for parallel fetching
    const fetchPromises = []

    for (let i = start; i <= end; i++) {
      if (i !== index && searchResults[i].source !== "upload") {
        const cacheKey = `${searchResults[i].source}-${searchResults[i].title}-${searchResults[i].artist}`
        if (!trackCache.has(cacheKey)) {
          fetchPromises.push(
            fetchTrackData(searchResults[i], i)
              .then((updatedTrack) => {
                updatedResults[i] = updatedTrack
              })
              .catch((err) => {
                console.error(`Error prefetching track at index ${i}:`, err)
              }),
          )
        }
      }
    }

    // Wait for all prefetch operations to complete
    if (fetchPromises.length > 0) {
      await Promise.all(fetchPromises)
      setSearchResults(updatedResults)
      setQueue(updatedResults)
    }
  }

  const handleSelect = async (item: MusicSnippet, index: number) => {
    setCurrentTrack(null)
    setPlaying(false)
    setLocalSearchStage("Loading track...")

    // For uploaded songs, no need to fetch additional data
    if (item.source === "upload") {
      setCurrentTrack(item)
      setQueue(searchResults)
      setPlaying(true)
      setLocalSearchStage(null)
      return
    }

    try {
      const updatedTrack = await fetchTrackData(item, index)
      const updatedResults = [...searchResults]
      updatedResults[index] = updatedTrack
      setSearchResults(updatedResults)
      setCurrentTrack(updatedTrack)
      setQueue(updatedResults)
      setPlaying(true)

      // Prefetch in background
      preFetchTracks(index).catch((err) => {
        console.error("Error in prefetching:", err)
      })
    } catch (error) {
      toast.error("Failed to load track")
      console.error("Track selection error:", error)
    } finally {
      setLocalSearchStage(null)
    }
  }

  const handlePlayAll = () => {
    if (searchResults.length === 0) return

    // Start playing from the first track
    handleSelect(searchResults[0], 0)
  }

  const handleSupportArtist = () => {
    if (!playlistMetadata?.link) return

    // Open the original platform link in a new tab
    window.open(playlistMetadata.link, "_blank")
  }

  const handleLike = async (track: MusicSnippet, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isSignedIn) {
      setPendingLikeTrack(track)
      setShowAuthDialog(true)
      return
    }

    try {
      const response = await axios.post("/api/likes", { track })
      if (response.data.success) {
        setLikedSongs((prev) => [...prev, track])
        toast.success("Song liked!")
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.info("Song already liked")
      } else {
        toast.error("Failed to like song")
      }
    }
  }

  const handleAuthComplete = () => {
    setShowAuthDialog(false)

    if (isSignedIn && pendingLikeTrack) {
      handleLike(pendingLikeTrack, { stopPropagation: () => {} } as React.MouseEvent)
      setPendingLikeTrack(null)
    }
  }

  const handleSavePlaylist = async () => {
    if (!isSignedIn || !playlistMetadata) {
      setShowAuthDialog(true)
      return
    }

    try {
      const response = await axios.post("/api/playlists", {
        name: playlistMetadata.title,
        tracks: searchResults,
        link: initialQuery, // Save the original query/link
      })
      if (response.data.success) {
        setSavedPlaylists((prev) => [...prev, playlistMetadata.title])
        toast.success("Playlist saved!")
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.info("Playlist already exists")
      } else {
        toast.error("Failed to save playlist")
      }
    }
  }

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
      axios
        .get("/api/playlists")
        .then((res) => {
          setSavedPlaylists(res.data.map((p: any) => p.name))
        })
        .catch(() => {
          toast.error("Failed to fetch playlists")
        })
    }
  }, [isSignedIn])

  useEffect(() => {
    if (searchResults.length > 0) {
      fetchDurations(searchResults)

      // Initialize the track index map
      trackIndexMapRef.current.clear()
      searchResults.forEach((track, index) => {
        const trackId = getTrackUniqueId(track, index)
        trackIndexMapRef.current.set(trackId, index)
      })
    }
  }, [searchResults])

  // Check if a track is currently playing
  const isPlaying = useCallback(
    (item: MusicSnippet) => {
      if (!currentTrack) return false

      if (item.source === "upload" && currentTrack.source === "upload") {
        return item.filePath === currentTrack.filePath
      }

      return item.videoId === currentTrack.videoId
    },
    [currentTrack],
  )

  const memoizedIsLiked = useCallback(
    (item: MusicSnippet) => {
      return likedSongs.some(
        (song) => (song.videoId && song.videoId === item.videoId) || (song.filePath && song.filePath === item.filePath),
      )
    },
    [likedSongs],
  )

  // Determine which search stage to display
  const searchStage = localSearchStage || globalSearchStage

  if (loading && searchResults.length === 0) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (searchResults.length === 0) return null

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {playlistMetadata ? (
        <div className="mb-6 pb-4 border-b flex items-start gap-4">
          <Image
            src={playlistMetadata.thumbnail || "/placeholder.svg?height=128&width=128"}
            alt="Playlist Cover"
            width={128}
            height={128}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{playlistMetadata.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Image
                src={playlistMetadata.creatorThumbnail || "/placeholder.svg?height=24&width=24"}
                alt="Creator Logo"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p className="text-sm text-gray-600">{playlistMetadata.creator}</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">{totalTracks} songs</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleSavePlaylist}>
                {savedPlaylists.includes(playlistMetadata.title) ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Save className="h-4 w-4 text-gray-500" />
                )}
                {savedPlaylists.includes(playlistMetadata.title) ? "Saved" : "Save Playlist"}
              </Button>
              <Button variant="default" size="sm" className="flex items-center gap-2" onClick={handlePlayAll}>
                <Play className="h-4 w-4" />
                Play All
              </Button>
              {playlistMetadata.link && (
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleSupportArtist}>
                  <ExternalLink className="h-4 w-4" />
                  Support Artist
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Search Results</p>
      )}

      {searchStage && (
        <div className="text-center py-2 mb-4">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
          <p className="text-sm text-gray-600">{searchStage}</p>
        </div>
      )}

      <InfiniteScroll
        dataLength={searchResults.length}
        next={() => loadMore(initialQuery)}
        hasMore={hasMore}
        loader={<Loader2 className="h-6 w-6 animate-spin mx-auto my-4" />}
        endMessage={<p className="text-center text-gray-500 my-4">No more tracks to load</p>}
      >
        <div className="space-y-2">
          {searchResults.map((item, index) => {
            // Create a truly unique key for each item
            const uniqueId = getTrackUniqueId(item, index)

            const duration =
              durations[item.videoId || uniqueId] !== undefined
                ? formatDuration(durations[item.videoId || uniqueId])
                : "N/A"

            // Use original data if available, otherwise use fetched data
            const displayTitle = item.originalTitle || item.title || "Unknown Title"
            const displayArtist = item.originalArtist || item.artist || "Unknown Artist"
            const displayThumbnail =
              item.originalThumbnail || item.thumbnails?.default?.url || "https://placehold.co/120"

            const isCurrentlyPlaying = isPlaying(item)
            const isLiked = memoizedIsLiked(item)

            return (
              <Card
                key={uniqueId}
                className={`cursor-pointer hover:bg-gray-100 flex items-center justify-between transition-colors ${
                  isCurrentlyPlaying ? "bg-blue-50 border-blue-300" : ""
                }`}
                onClick={() => handleSelect(item, index)}
              >
                <CardContent className="p-2 flex items-center gap-2 flex-1">
                  <span className="text-gray-500 text-sm w-8">
                    {isCurrentlyPlaying ? <PlayCircle className="h-5 w-5 text-blue-500 animate-pulse" /> : index + 1}
                  </span>
                  <Image
                    src={displayThumbnail || "/placeholder.svg?height=48&width=48"}
                    alt={displayTitle}
                    width={48}
                    height={48}
                    className={`rounded ${isCurrentlyPlaying ? "ring-2 ring-blue-400" : ""}`}
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrentlyPlaying ? "text-blue-600" : ""}`}>{displayTitle}</p>
                    <p className="text-xs text-gray-600">{displayArtist}</p>
                  </div>
                  <span className="text-xs text-gray-500">{duration}</span>
                  <span className="text-xs text-gray-400">{item.source}</span>
                </CardContent>
                <Button variant="ghost" size="icon" className="mr-2" onClick={(e) => handleLike(item, e)}>
                  <Heart
                    className={`h-4 w-4 ${isLiked ? "text-red-500 fill-red-500" : "text-gray-500 hover:text-red-500"}`}
                  />
                </Button>
              </Card>
            )
          })}
        </div>
      </InfiniteScroll>

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => {
          setShowAuthDialog(false)
          setPendingLikeTrack(null)
        }}
        title="Authentication Required"
        description={
          playlistMetadata
            ? "You need to be logged in to save playlists. Would you like to sign in now?"
            : "You need to be logged in to like songs. Would you like to sign in now?"
        }
        actionType={playlistMetadata ? "save" : "like"}
        onComplete={handleAuthComplete}
      />
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? "0" + secs : secs}`
}

