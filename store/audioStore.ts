import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MusicSnippet, PlaylistMetadata } from "@/types/music";

type PlayMode = "normal" | "shuffle" | "single" | "loop";

interface AudioState {
  queue: MusicSnippet[];
  setQueue: (queue: MusicSnippet[]) => void;
  currentTrack: MusicSnippet | null;
  setCurrentTrack: (track: MusicSnippet | null) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  searchResults: MusicSnippet[];
  setSearchResults: (results: MusicSnippet[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  playlistMetadata: PlaylistMetadata | null;
  setPlaylistMetadata: (metadata: PlaylistMetadata | null) => void;
  spotifyAccessToken: string | null;
  setSpotifyAccessToken: (token: string | null) => void;
  reset: () => void;
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
          const newQueue = [...state.queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);
          return { queue: newQueue };
        }),
      searchResults: [],
      setSearchResults: (searchResults) => set({ searchResults }),
      loading: false,
      setLoading: (loading) => set({ loading }),
      playlistMetadata: null,
      setPlaylistMetadata: (playlistMetadata) => set({ playlistMetadata }),
      spotifyAccessToken: null,
      setSpotifyAccessToken: (spotifyAccessToken) => set({ spotifyAccessToken }),
      reset: () =>
        set((state) => ({
          queue: [],
          currentTrack: null,
          playing: false,
          searchResults: [],
          playlistMetadata: null,
          // Preserve spotifyAccessToken
          spotifyAccessToken: state.spotifyAccessToken,
        })),
    }),
    {
      name: "audio-storage",
      partialize: (state) => ({
        queue: state.queue,
        currentTrack: state.currentTrack,
        playMode: state.playMode,
        spotifyAccessToken: state.spotifyAccessToken, // Persist token
      }),
    }
  )
);