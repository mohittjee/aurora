"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAudioStore } from "@/store/audioStore"
import SearchBar from "@/components/SearchBar"
import AudioPlayer from "@/components/AudioPlayer/AudioPlayer"
import SearchResults from "@/components/Playlist/SearchResults"
import SongQueue from "@/components/Playlist/SongQueue"
import AuthButton from "@/components/AuthButton"
import axios from "axios"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MusicSnippet } from "@/types/music"
import Image from "next/image"
import { PlayCircle, Loader2, Play } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthDialog } from "@/components/ui/auth-dialog"
import { Button } from "@/components/ui/button"
import InfiniteScroll from "react-infinite-scroll-component"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Search() {
  const { isSignedIn } = useUser()
  const {
    setSearchResults,
    appendSearchResults,
    setLoading,
    setQueue,
    setPlaylistMetadata,
    reset,
    setError,
    offset,
    setOffset,
    setHasMore,
    setTotalTracks,
    setCurrentTrack,
    setPlaying,
    currentTrack,
    loading,
    setSearchStage,
  } = useAudioStore()

  const [initialQuery, setInitialQuery] = useState<string>("")
  const [uploadedSongs, setUploadedSongs] = useState<MusicSnippet[]>([])
  const [likedSongs, setLikedSongs] = useState<MusicSnippet[]>([])
  const [savedPlaylists, setSavedPlaylists] = useState<
    { id: string; name: string; link?: string; tracks: { tracks: MusicSnippet[] } }[]
  >([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<MusicSnippet[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [loadingUploads, setLoadingUploads] = useState(false)
  const [loadingLikes, setLoadingLikes] = useState(false)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false)

  const [searchStageLocal, setSearchStageLocal] = useState<string | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null)
  const [selectedPlaylistHasMore, setSelectedPlaylistHasMore] = useState(false)
  const [selectedPlaylistOffset, setSelectedPlaylistOffset] = useState(0)
  const [selectedPlaylistTotal, setSelectedPlaylistTotal] = useState(0)

  // Auto-focus the search input on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const fetchSearchResults = async (query: string, isLoadMore = false) => {
    setLoading(true)
    if (!isLoadMore) {
      reset()
      setInitialQuery(query)
      setActiveTab("search")
      setSearchStage("Initializing search...")
    } else {
      setSearchStage("Loading more results...")
    }

    try {
      const response = await axios.get("/api/music", {
        params: {
          query,
          offset: isLoadMore ? offset : 0,
          limit: 20, // Add a limit parameter
        },
      })

      const { items, playlist, total, stage } = response.data

      // Update search stage based on response
      if (stage) {
        setSearchStage(formatSearchStage(stage))
      }

      if (!isLoadMore) {
        setSearchResults(items || [])
        setTotalTracks(total || items.length)
        if (playlist) {
          setQueue(items || [])
        }
      } else {
        appendSearchResults(items || [])
      }

      setPlaylistMetadata(playlist || null)
      setHasMore(items.length > 0 && offset + items.length < total)
      setOffset(offset + items.length)
      setError(null)

      // Log pagination info
      console.log(
        `Loaded ${items.length} items, total: ${total}, hasMore: ${items.length > 0 && (offset + items.length) < total}`,
      )
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred"
      setError(`Failed to fetch music data: ${errorMessage}`)
      toast.error(errorMessage)
      if (!isLoadMore) setSearchResults([])
      setPlaylistMetadata(null)
    } finally {
      setLoading(false)
      setSearchStage(null)
    }
  }

  const formatSearchStage = (stage: string) => {
    // Convert snake_case to readable format
    const formatted = stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

    return formatted
  }

  const fetchPlaylistDetails = async (playlistId: string, link?: string, loadMore = false) => {
    if (!loadMore) {
      setLoadingPlaylistTracks(true)
      setSelectedPlaylistId(playlistId)
      setSelectedPlaylistOffset(0)
      setSelectedPlaylistTracks([])
    }

    try {
      if (link) {
        // If we have a link, fetch from original source
        setSearchStage(loadMore ? "Loading more tracks..." : "Fetching playlist from source...")

        const currentOffset = loadMore ? selectedPlaylistOffset : 0

        const response = await axios.get("/api/music", {
          params: {
            query: link,
            offset: currentOffset,
            limit: 20,
          },
        })

        const { items, playlist, total } = response.data

        if (loadMore) {
          setSelectedPlaylistTracks((prev) => [...prev, ...(items || [])])
        } else {
          setSelectedPlaylistTracks(items || [])
          setSelectedPlaylistTotal(total || items.length)
        }

        // Store if there are more tracks to load
        const hasMoreTracks = items.length > 0 && currentOffset + items.length < total
        setSelectedPlaylistHasMore(hasMoreTracks)
        setSelectedPlaylistOffset(currentOffset + items.length)
      } else {
        // Otherwise use stored tracks
        const playlist = savedPlaylists.find((p) => p.id === playlistId)
        if (playlist) {
          setSelectedPlaylistTracks(playlist.tracks.tracks || [])
          setSelectedPlaylistHasMore(false) // No pagination for stored playlists
        }
      }
    } catch (error: any) {
      toast.error("Failed to fetch playlist details")
      if (!loadMore) {
        setSelectedPlaylistTracks([])
      }
    } finally {
      setLoadingPlaylistTracks(false)
      setSearchStage(null)
    }
  }

  const fetchUserData = useCallback(
    async (tabName?: string) => {
      if (!isSignedIn) return

      if (!tabName || tabName === "uploads") {
        setLoadingUploads(true)
        try {
          const res = await axios.get("/api/uploads")
          const uploads = res.data.map((upload: any) => ({
            videoId: upload.id,
            title: upload.title,
            artist: upload.artist,
            source: "upload",
            filePath: upload.filePath,
            thumbnails: { default: { url: "https://placehold.co/120" } },
          }))
          setUploadedSongs(uploads)
        } catch (error) {
          toast.error("Failed to fetch uploaded songs")
        } finally {
          setLoadingUploads(false)
        }
      }

      if (!tabName || tabName === "likes") {
        setLoadingLikes(true)
        try {
          const res = await axios.get("/api/likes")
          setLikedSongs(res.data)
        } catch (error) {
          toast.error("Failed to fetch liked songs")
        } finally {
          setLoadingLikes(false)
        }
      }

      if (!tabName || tabName === "playlists") {
        setLoadingPlaylists(true)
        try {
          const res = await axios.get("/api/playlists")
          setSavedPlaylists(res.data)
        } catch (error) {
          toast.error("Failed to fetch playlists")
        } finally {
          setLoadingPlaylists(false)
        }
      }
    },
    [isSignedIn],
  )

  // Initial data fetch
  useEffect(() => {
    if (isSignedIn) {
      fetchUserData()
    }
  }, [isSignedIn, fetchUserData])

  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Fetch data based on selected tab
    if (isSignedIn) {
      if (value === "uploads") {
        fetchUserData("uploads")
      } else if (value === "likes") {
        fetchUserData("likes")
      } else if (value === "playlists") {
        fetchUserData("playlists")
      }
    }
  }

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

  const handleTrackSelect = (track: MusicSnippet, tracks: MusicSnippet[]) => {
    if (!isSignedIn) {
      setPendingAction({ type: "play", data: { track, tracks } })
      setShowAuthDialog(true)
      return
    }

    setCurrentTrack(track)
    setQueue(tracks)
    setPlaying(true)
  }

  const handlePlayAll = (tracks: MusicSnippet[]) => {
    if (tracks.length === 0) return

    handleTrackSelect(tracks[0], tracks)
  }

  const handleAuthComplete = () => {
    setShowAuthDialog(false)

    if (pendingAction && isSignedIn) {
      if (pendingAction.type === "play" && pendingAction.data) {
        const { track, tracks } = pendingAction.data
        setCurrentTrack(track)
        setQueue(tracks)
        setPlaying(true)
      }

      setPendingAction(null)
    }
  }

  const handleUploadComplete = () => {
    fetchUserData("uploads")
  }

  if (!isSignedIn) {
    return (
      <div className="max-h-screen">
        <main className="p-4 pointer-events-none">
          <div className="pt-10 pb-4 pointer-events-auto">
            <SearchBar
              onSearch={(query) => fetchSearchResults(query, false)}
              ref={searchInputRef}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {searchStageLocal && (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">{searchStageLocal}</p>
            </div>
          )}

          <SearchResults loadMore={() => fetchSearchResults(initialQuery, true)} initialQuery={initialQuery} />
          <SongQueue />
          <AudioPlayer />

          {/* Auth Dialog */}
          <AuthDialog
            isOpen={showAuthDialog}
            onClose={() => {
              setShowAuthDialog(false)
              setPendingAction(null)
            }}
            title="Authentication Required"
            description="You need to be logged in to play songs. Would you like to sign in now?"
            actionType="like"
            onComplete={handleAuthComplete}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="h-full flex pointer-events-auto">
      <main className="p-4 flex-1">
        <div className="pb-4">
          <SearchBar
            onSearch={(query) => fetchSearchResults(query, false)}
            ref={searchInputRef}
            onFocus={() => setActiveTab("search")}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {searchStageLocal && (
          <div className="p-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">{searchStageLocal}</p>
          </div>
        )}

        <div className="flex gap-4">
          {/* Vertical tabs on the left */}
          <div className="w-56 h-[calc(100vh-260px)] shrink-0">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex flex-col h-full justify-between">
              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange("uploads")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "uploads" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  Uploaded Songs
                </button>
                <button
                  onClick={() => handleTabChange("likes")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "likes" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  Liked Songs
                </button>
                <button
                  onClick={() => handleTabChange("playlists")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === "playlists" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  Saved Playlists
                </button>
              </nav>
              <div className="mt-4 pl-3">
                <AuthButton />
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 h-[calc(100vh-250px)]">
            {/* <ScrollArea className="h-[calc(100vh-240px)]"> */}
              {/* Always show search results when available */}
              {initialQuery && (
                <div className={activeTab === "search" ? "block" : "hidden"}>
                  <SearchResults loadMore={() => fetchSearchResults(initialQuery, true)} initialQuery={initialQuery} />
                </div>
              )}

              {/* Show content based on selected tab */}
              <div className={activeTab === "uploads" ? "block" : "hidden"}>
                {loadingUploads ? (
                  <TrackListSkeleton />
                ) : (
                  <TrackList
                    tracks={uploadedSongs}
                    onSelect={(track) => handleTrackSelect(track, uploadedSongs)}
                    onPlayAll={() => handlePlayAll(uploadedSongs)}
                    isPlaying={isPlaying}
                    showPlayAll={uploadedSongs.length > 0}
                  />
                )}
              </div>

              <div className={activeTab === "likes" ? "block" : "hidden"}>
                {loadingLikes ? (
                  <TrackListSkeleton />
                ) : (
                  <TrackList
                    tracks={likedSongs}
                    onSelect={(track) => handleTrackSelect(track, likedSongs)}
                    onPlayAll={() => handlePlayAll(likedSongs)}
                    isPlaying={isPlaying}
                    showPlayAll={likedSongs.length > 0}
                  />
                )}
              </div>

              <div className={activeTab === "playlists" ? "block" : "hidden"}>
                {loadingPlaylists ? (
                  <PlaylistSkeleton />
                ) : (
                  <PlaylistList
                    playlists={savedPlaylists}
                    onSelectPlaylist={fetchPlaylistDetails}
                    selectedPlaylistId={selectedPlaylistId}
                    selectedTracks={selectedPlaylistTracks}
                    onSelectTrack={(track) => handleTrackSelect(track, selectedPlaylistTracks)}
                    onPlayAll={() => handlePlayAll(selectedPlaylistTracks)}
                    isPlaying={isPlaying}
                    isLoading={loadingPlaylistTracks}
                    hasMoreTracks={selectedPlaylistHasMore}
                    loadMoreTracks={() =>
                      fetchPlaylistDetails(
                        selectedPlaylistId!,
                        savedPlaylists.find((p) => p.id === selectedPlaylistId)?.link,
                        true,
                      )
                    }
                  />
                )}
              </div>
            {/* </ScrollArea> */}
          </div>
        </div>

        <SongQueue />
        <AudioPlayer />
      </main>
    </div>
  )
}

interface TrackListProps {
  tracks: MusicSnippet[]
  onSelect: (track: MusicSnippet) => void
  onPlayAll: () => void
  isPlaying: (track: MusicSnippet) => boolean
  showPlayAll?: boolean
}

function TrackList({ tracks, onSelect, onPlayAll, isPlaying, showPlayAll = false }: TrackListProps) {
  return (
    <ScrollArea className="space-y-2 max-w-2xl mx-auto h-[calc(100vh-250px)]">
      {showPlayAll && (
        <div className="flex justify-end mb-4">
          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={onPlayAll}>
            <Play className="h-4 w-4" />
            Play All
          </Button>
        </div>
      )}

      {tracks.map((item, index) => {
        // Create a truly unique key for each item
        const uniqueId = item.videoId || item.filePath || `${item.title}-${item.artist}-${index}`

        const isCurrentlyPlaying = isPlaying(item)
        return (
          <div
            key={uniqueId}
            className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded ${
              isCurrentlyPlaying ? "bg-blue-50 border border-blue-300" : ""
            }`}
            onClick={() => onSelect(item)}
          >
            <span className="text-gray-500 text-sm w-8">
              {isCurrentlyPlaying ? <PlayCircle className="h-5 w-5 text-blue-500 animate-pulse" /> : index + 1}
            </span>
            <Image
              src={item.thumbnails?.default?.url || "/placeholder.svg?height=48&width=48"}
              alt={item.title || "Unknown Title"}
              width={48}
              height={48}
              className={`rounded ${isCurrentlyPlaying ? "ring-2 ring-blue-400" : ""}`}
            />
            <div>
              <p className={`text-sm font-medium ${isCurrentlyPlaying ? "text-blue-600" : ""}`}>
                {item.title || "Unknown Title"}
              </p>
              <p className="text-xs text-gray-600">{item.artist || "Unknown Artist"}</p>
            </div>
          </div>
        )
      })}
      {tracks.length === 0 && <p className="text-center text-gray-500 py-4">No tracks found</p>}
    </ScrollArea>
  )
}

function TrackListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-2 flex items-center gap-2">
          <span className="text-gray-500 text-sm w-8">{index + 1}</span>
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface PlaylistListProps {
  playlists: { id: string; name: string; link?: string; tracks: { tracks: MusicSnippet[] } }[]
  onSelectPlaylist: (id: string, link?: string) => void
  selectedPlaylistId: string | null
  selectedTracks: MusicSnippet[]
  onSelectTrack: (track: MusicSnippet) => void
  onPlayAll: () => void
  isPlaying: (track: MusicSnippet) => boolean
  isLoading: boolean
  hasMoreTracks: boolean
  loadMoreTracks: () => void
}

function PlaylistList({
  playlists,
  onSelectPlaylist,
  selectedPlaylistId,
  selectedTracks,
  onSelectTrack,
  onPlayAll,
  isPlaying,
  isLoading,
  hasMoreTracks,
  loadMoreTracks,
}: PlaylistListProps) {
  return (
    // <div className="space-y-4">
      <ScrollArea className="space-y-2 h-[calc(100vh-250px)]">
        {playlists.map((playlist) => {
          const isSelected = selectedPlaylistId === playlist.id
          return (
            <div key={playlist.id} className="space-y-2">
              <div
                className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
                  isSelected ? "bg-blue-50 border border-blue-300" : ""
                }`}
                onClick={() => onSelectPlaylist(playlist.id, playlist.link)}
              >
                <p className="text-sm font-medium">{playlist.name}</p>
                {playlist.link && <p className="text-xs text-gray-600">{playlist.link}</p>}
              </div>

              {isSelected && (
                <div className="ml-4 border-l-2 border-blue-300 pl-4 h-[30vh] overflow-y-scroll"  id="scrollableDiv">
                  {isLoading && selectedTracks.length === 0 ? (
                    <div className="py-2">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      <p className="text-sm text-center text-gray-500 mt-2">Loading playlist tracks...</p>
                    </div>
                  ) : (
                    <>
                      {selectedTracks.length > 0 && (
                        <div className="flex justify-end mb-2">
                          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={onPlayAll}>
                            <Play className="h-4 w-4" />
                            Play All
                          </Button>
                        </div>
                      )}

                      {/* <ScrollArea className="h-[50vh]" > */}
                        <InfiniteScroll
                          dataLength={selectedTracks.length}
                          next={loadMoreTracks}
                          hasMore={hasMoreTracks}
                          loader={
                            <div className="text-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              <p className="text-xs text-gray-500 mt-1">Loading more tracks...</p>
                            </div>
                          }
                          endMessage={
                            selectedTracks.length > 0 ? (
                              <p className="text-center text-xs text-gray-500 py-2">No more tracks to load</p>
                            ) : null
                          }
                          scrollableTarget="scrollableDiv"
                        >
                          <div className="space-y-2">
                            {selectedTracks.map((item, index) => {
                              // Create a truly unique key for each item
                              const uniqueId = item.videoId || item.filePath || `${item.title}-${item.artist}-${index}`

                              const isCurrentlyPlaying = isPlaying(item)
                              return (
                                <div
                                  key={uniqueId}
                                  className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded ${
                                    isCurrentlyPlaying ? "bg-blue-50 border border-blue-300" : ""
                                  }`}
                                  onClick={() => onSelectTrack(item)}
                                >
                                  <span className="text-gray-500 text-sm w-8">
                                    {isCurrentlyPlaying ? (
                                      <PlayCircle className="h-5 w-5 text-blue-500 animate-pulse" />
                                    ) : (
                                      index + 1
                                    )}
                                  </span>
                                  <Image
                                    src={item.thumbnails?.default?.url || "/placeholder.svg?height=48&width=48"}
                                    alt={item.title || "Unknown Title"}
                                    width={48}
                                    height={48}
                                    className={`rounded ${isCurrentlyPlaying ? "ring-2 ring-blue-400" : ""}`}
                                  />
                                  <div>
                                    <p className={`text-sm font-medium ${isCurrentlyPlaying ? "text-blue-600" : ""}`}>
                                      {item.title || "Unknown Title"}
                                    </p>
                                    <p className="text-xs text-gray-600">{item.artist || "Unknown Artist"}</p>
                                  </div>
                                </div>
                              )
                            })}
                            {selectedTracks.length === 0 && !isLoading && (
                              <p className="text-center text-gray-500 py-2">No tracks in this playlist</p>
                            )}
                          </div>
                        </InfiniteScroll>
                      {/* </ScrollArea> */}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {playlists.length === 0 && <p className="text-center text-gray-500 py-4">No saved playlists</p>}
      </ScrollArea>
    // </div>
  )
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="p-2">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      ))}
    </div>
  )
}








// "use client";

// import { useState } from "react";
// import { useAudioStore } from "@/store/audioStore";
// import SearchBar from "@/components/SearchBar";
// import AudioPlayer from "@/components/AudioPlayer/AudioPlayer";
// import SearchResults from "@/components/Playlist/SearchResults";
// import SongQueue from "@/components/Playlist/SongQueue";
// import AuthButton from "@/components/AuthButton";
// import axios from "axios";

// export default function Home() {
//   const {
//     setSearchResults,
//     appendSearchResults,
//     setLoading,
//     setQueue,
//     setPlaylistMetadata,
//     reset,
//     setError,
//     offset,
//     setOffset,
//     setHasMore,
//     setTotalTracks,
//   } = useAudioStore();
//   const [initialQuery, setInitialQuery] = useState<string>("");

//   const fetchSearchResults = async (query: string, isLoadMore = false) => {
//     setLoading(true);
//     if (!isLoadMore) {
//       reset();
//       setInitialQuery(query);
//     }

//     try {
//       const response = await axios.get("/api/music", { params: { query, offset: isLoadMore ? offset : 0 } });
//       const { items, playlist, total } = response.data;

//       if (!isLoadMore) {
//         setSearchResults(items || []);
//         setTotalTracks(total || items.length);
//       } else {
//         appendSearchResults(items || []);
//       }

//       setPlaylistMetadata(playlist || null);
//       if (playlist && !isLoadMore) setQueue(items || []);
//       setHasMore(items.length > 0 && (offset + items.length) < total);
//       setOffset(offset + items.length);
//       setError(null);
//     } catch (error: any) {
//       console.error("Error fetching data:", error);
//       const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
//       setError(`Failed to fetch music data: ${errorMessage}`);
//       if (!isLoadMore) setSearchResults([]);
//       setPlaylistMetadata(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen pb-20">
//       <header className="flex justify-between items-center p-4 bg-white shadow">
//         <h1 className="text-2xl font-semibold">Music Player</h1>
//         <AuthButton />
//       </header>
//       <main className="p-4">
//         <SearchBar onSearch={(query) => fetchSearchResults(query, false)} />
//         <SearchResults loadMore={() => fetchSearchResults(initialQuery, true)} initialQuery={initialQuery} />
//         <SongQueue />
//         <AudioPlayer />
//       </main>
//     </div>
//   );
// }