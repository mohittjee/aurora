"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { YouTubeSearchItem, YouTubePlaylistItem } from "@/types/youtube";

type PlayMode = "normal" | "shuffle" | "single" | "loop";

interface AudioContextType {
  queue: (YouTubeSearchItem | YouTubePlaylistItem)[];
  setQueue: (queue: (YouTubeSearchItem | YouTubePlaylistItem)[]) => void;
  currentTrack: YouTubeSearchItem | YouTubePlaylistItem | null;
  setCurrentTrack: (track: YouTubeSearchItem | YouTubePlaylistItem | null) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  playMode: PlayMode;
  setPlayMode: (mode: PlayMode) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  searchResults: (YouTubeSearchItem | YouTubePlaylistItem)[];
  setSearchResults: (results: (YouTubeSearchItem | YouTubePlaylistItem)[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<(YouTubeSearchItem | YouTubePlaylistItem)[]>([]);
  const [currentTrack, setCurrentTrack] = useState<YouTubeSearchItem | YouTubePlaylistItem | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [playMode, setPlayMode] = useState<PlayMode>("normal");
  const [searchResults, setSearchResults] = useState<(YouTubeSearchItem | YouTubePlaylistItem)[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const moveTrack = (fromIndex: number, toIndex: number) => {
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    setQueue(newQueue);
  };

  return (
    <AudioContext.Provider
      value={{
        queue,
        setQueue,
        currentTrack,
        setCurrentTrack,
        playing,
        setPlaying,
        playMode,
        setPlayMode,
        moveTrack,
        searchResults,
        setSearchResults,
        loading,
        setLoading,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within an AudioProvider");
  return context;
}