"use client";

import { useState } from "react";
import { useAudioStore } from "@/store/audioStore";
import SearchBar from "@/components/SearchBar";
import AudioPlayer from "@/components/AudioPlayer/AudioPlayer";
import SearchResults from "@/components/Playlist/SearchResults";
import SongQueue from "@/components/Playlist/SongQueue";
import AuthButton from "@/components/AuthButton";
import axios from "axios";

export default function Home() {
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
  } = useAudioStore();
  const [initialQuery, setInitialQuery] = useState<string>("");

  const fetchSearchResults = async (query: string, isLoadMore = false) => {
    setLoading(true);
    if (!isLoadMore) {
      reset();
      setInitialQuery(query);
    }

    try {
      const response = await axios.get("/api/music", { params: { query, offset: isLoadMore ? offset : 0 } });
      const { items, playlist, total } = response.data;

      if (!isLoadMore) {
        setSearchResults(items || []);
        setTotalTracks(total || items.length);
      } else {
        appendSearchResults(items || []);
      }

      setPlaylistMetadata(playlist || null);
      if (playlist && !isLoadMore) setQueue(items || []);
      setHasMore(items.length > 0 && (offset + items.length) < total);
      setOffset(offset + items.length);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      setError(`Failed to fetch music data: ${errorMessage}`);
      if (!isLoadMore) setSearchResults([]);
      setPlaylistMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-2xl font-semibold">Music Player</h1>
        <AuthButton />
      </header>
      <main className="p-4">
        <SearchBar onSearch={(query) => fetchSearchResults(query, false)} />
        <SearchResults loadMore={() => fetchSearchResults(initialQuery, true)} initialQuery={initialQuery} />
        <SongQueue />
        <AudioPlayer />
      </main>
    </div>
  );
}