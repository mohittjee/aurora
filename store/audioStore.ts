import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { MusicSnippet, PlaylistMetadata } from "@/types/music"

type PlayMode = "normal" | "shuffle" | "single" | "loop"

interface AudioState {
  queue: MusicSnippet[]
  setQueue: (queue: MusicSnippet[]) => void
  currentTrack: MusicSnippet | null
  setCurrentTrack: (track: MusicSnippet | null) => void
  playing: boolean
  setPlaying: (playing: boolean) => void
  playMode: PlayMode
  setPlayMode: (mode: PlayMode) => void
  moveTrack: (fromIndex: number, toIndex: number) => void
  searchResults: MusicSnippet[]
  setSearchResults: (results: MusicSnippet[]) => void
  appendSearchResults: (results: MusicSnippet[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  playlistMetadata: PlaylistMetadata | null
  setPlaylistMetadata: (metadata: PlaylistMetadata | null) => void
  error: string | null
  setError: (error: string | null) => void
  hasMore: boolean
  setHasMore: (hasMore: boolean) => void
  offset: number
  setOffset: (offset: number) => void
  totalTracks: number
  setTotalTracks: (total: number) => void
  youtubeCache: Record<string, string>
  setYoutubeCache: (key: string, videoId: string) => void
  currentTime: number
  setCurrentTime: (time: number) => void
  duration: number
  setDuration: (duration: number) => void
  isBuffering: boolean
  setIsBuffering: (buffering: boolean) => void
  volume: number // 0 to 100
  setVolume: (volume: number) => void
  muted: boolean
  setMuted: (muted: boolean) => void
  searchStage: string | null
  setSearchStage: (stage: string | null) => void
  reset: () => void
  seekTo: (time: number) => void
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      queue: [],
      setQueue: (queue) => set({ queue }),
      currentTrack: null,
      setCurrentTrack: (currentTrack) => set({ currentTrack }),
      playing: false,
      setPlaying: (playing) => set({ playing }),
      playMode: "normal",
      setPlayMode: (playMode) => set({ playMode }),
      moveTrack: (fromIndex, toIndex) =>
        set((state) => {
          const newQueue = [...state.queue]
          const [movedItem] = newQueue.splice(fromIndex, 1)
          newQueue.splice(toIndex, 0, movedItem)
          return { queue: newQueue }
        }),
      searchResults: [],
      setSearchResults: (searchResults) => set({ searchResults }),
      appendSearchResults: (results) => set((state) => ({ searchResults: [...state.searchResults, ...results] })),
      loading: false,
      setLoading: (loading) => set({ loading }),
      playlistMetadata: null,
      setPlaylistMetadata: (playlistMetadata) => set({ playlistMetadata }),
      error: null,
      setError: (error) => set({ error }),
      hasMore: true,
      setHasMore: (hasMore) => set({ hasMore }),
      offset: 0,
      setOffset: (offset) => set({ offset }),
      totalTracks: 0,
      setTotalTracks: (total) => set({ totalTracks: total }),
      youtubeCache: {},
      setYoutubeCache: (key, videoId) =>
        set((state) => ({
          youtubeCache: { ...state.youtubeCache, [key]: videoId },
        })),
      currentTime: 0,
      setCurrentTime: (currentTime) => set({ currentTime }),
      duration: 0,
      setDuration: (duration) => set({ duration }),
      isBuffering: false,
      setIsBuffering: (isBuffering) => set({ isBuffering }),
      volume: 100,
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
      muted: false,
      setMuted: (muted) => set({ muted }),
      searchStage: null,
      setSearchStage: (searchStage) => set({ searchStage }),
      seekTo: (time) => {
        set({ currentTime: time })
      },
      reset: () =>
        set({
          queue: [],
          currentTrack: null,
          playing: false,
          playMode: "normal",
          searchResults: [],
          playlistMetadata: null,
          error: null,
          hasMore: true,
          offset: 0,
          totalTracks: 0,
          youtubeCache: {},
          currentTime: 0,
          duration: 0,
          isBuffering: false,
          searchStage: null,
        }),
    }),
    {
      name: "audio-storage",
      partialize: (state) => ({
        queue: state.queue,
        currentTrack: state.currentTrack,
        playMode: state.playMode,
        youtubeCache: state.youtubeCache,
        volume: state.volume,
        muted: state.muted,
      }),
    },
  ),
)

