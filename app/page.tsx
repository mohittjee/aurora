"use client";

import { useAudioStore } from "@/store/audioStore";
import SearchBar from "@/components/SearchBar";
import AudioPlayer from "@/components/AudioPlayer/AudioPlayer";
import SearchResults from "@/components/Playlist/SearchResults";
import SongQueue from "@/components/Playlist/SongQueue";
import axios from "axios";

export default function Home() {
  const { setSearchResults, setLoading, setQueue, setPlaylistMetadata, reset, spotifyAccessToken } = useAudioStore();

  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    reset(); // Clears everything except spotifyAccessToken
    try {
      const response = await axios.get("/api/music", { params: { query } });
      const { items, playlist } = response.data;

      setSearchResults(items || []);
      setPlaylistMetadata(playlist || null);
      if (playlist) setQueue(items || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <h1 className="text-2xl font-medium text-center py-4">Music Audio Player</h1>
      {!spotifyAccessToken && (
        <p className="text-center text-sm text-gray-600 mb-4">
          <a href="/api/spotify-auth" className="text-blue-600 hover:underline">
            Login with Spotify
          </a>{" "}
          for full track playback
        </p>
      )}
      <SearchBar onSearch={fetchSearchResults} />
      <SearchResults />
      <SongQueue />
      <AudioPlayer />
    </div>
  );
}