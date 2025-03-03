"use client";

import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioStore } from "@/store/audioStore";
import { MusicSnippet } from "@/types/music";
import { Loader2, Heart } from "lucide-react";
import axios from "axios";
import { useUser } from "@clerk/nextjs"; // Clerk hook
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  loadMore: (query: string) => void;
  initialQuery: string;
}

export default function SearchResults({ loadMore, initialQuery }: SearchResultsProps) {
  const { user, isSignedIn } = useUser(); // Clerk's useUser hook
  const { searchResults, setCurrentTrack, setQueue, setPlaying, loading, playlistMetadata, error, hasMore, totalTracks } = useAudioStore();
  const [durations, setDurations] = useState<Record<string, number>>({});

  const fetchDurations = async (tracks: MusicSnippet[]) => {
    const durationMap: Record<string, number> = {};
    const uncachedVideoIds = tracks
      .filter((t) => t.videoId && t.source === "youtube_music" && !durations[t.videoId])
      .map((t) => t.videoId!);

    if (uncachedVideoIds.length > 0) {
      try {
        const ytResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            part: "contentDetails",
            id: uncachedVideoIds.join(","),
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          },
        });
        ytResponse.data.items.forEach((item: any) => {
          const match = item.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const hours = parseInt(match?.[1] || "0") * 3600;
          const minutes = parseInt(match?.[2] || "0") * 60;
          const seconds = parseInt(match?.[3] || "0");
          durationMap[item.id] = hours + minutes + seconds;
        });
      } catch (error) {
        // console.error("YouTube Duration Fetch Error:", error.response?.data || error.message);
        console.error("YouTube Duration Fetch Error:", error);
      }
    }

    setDurations((prev) => ({ ...prev, ...durationMap }));
  };

  const handleLike = async (trackId: string) => {
    if (!isSignedIn) return; // Only allow likes if signed in
    try {
      await axios.post("/api/likes", { trackId });
      alert("Song liked!");
    } catch (error) {
      console.error("Error liking song:", error);
      alert("Failed to like song");
    }
  };

  const handleSavePlaylist = async () => {
    if (!isSignedIn || !playlistMetadata) return;
    try {
      await axios.post("/api/playlists", { name: playlistMetadata.title, tracks: searchResults });
      alert("Playlist saved!");
    } catch (error) {
      console.error("Error saving playlist:", error);
      alert("Failed to save playlist");
    }
  };

  useEffect(() => {
    if (searchResults.length > 0) {
      fetchDurations(searchResults);
    }
  }, [searchResults]);

  const handleSelect = (item: MusicSnippet) => {
    setCurrentTrack(null);
    setPlaying(false);
    setCurrentTrack(item);
    setQueue(searchResults);
  };

  if (loading && searchResults.length === 0) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (searchResults.length === 0) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {playlistMetadata ? (
        <div className="mb-6 pb-4 border-b flex items-start gap-4">
          <Image
            src={playlistMetadata.thumbnail}
            alt="Playlist Cover"
            width={128}
            height={128}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{playlistMetadata.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Image
                src={playlistMetadata.creatorThumbnail}
                alt="Creator Logo"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p className="text-sm text-gray-600">{playlistMetadata.creator}</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">{totalTracks} songs</p>
            {isSignedIn && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleSavePlaylist}
              >
                Save Playlist
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Search Results</p>
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
            const id = item.videoId || `${item.title}-${item.artist}`;
            const duration = durations[id] !== undefined ? formatDuration(durations[id]) : "N/A";
            return (
              <Card
                key={id || index}
                className="cursor-pointer hover:bg-gray-100 flex items-center justify-between transition-colors"
                onClick={() => handleSelect(item)}
              >
                <CardContent className="p-2 flex items-center gap-2 flex-1">
                  <span className="text-gray-500 text-sm w-8">{index + 1}</span>
                  <Image
                    src={item.thumbnails.default.url}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.artist}</p>
                  </div>
                  <span className="text-xs text-gray-500">{duration}</span>
                  <span className="text-xs text-gray-400">{item.source}</span>
                </CardContent>
                {isSignedIn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(`${item.title}-${item.artist}`);
                    }}
                  >
                    <Heart className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </InfiniteScroll>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" + secs : secs}`;
}