"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioStore } from "@/store/audioStore";
import { MusicSnippet } from "@/types/music";
import { Loader2 } from "lucide-react";
import axios from "axios";

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" + secs : secs}`;
};

export default function SearchResults() {
  const { searchResults, setCurrentTrack, setQueue, setPlaying, loading, playlistMetadata } = useAudioStore();
  const [durations, setDurations] = useState<Record<string, number>>({});

  const fetchDurations = async (tracks: MusicSnippet[]) => {
    const durationMap: Record<string, number> = {};

    const videoIds = tracks
      .filter((t) => t.source !== "spotify" && t.videoId)
      .map((t) => t.videoId!);
    if (videoIds.length > 0) {
      try {
        const ytResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            part: "contentDetails",
            id: videoIds.join(","),
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
          },
        });
        console.log("YouTube Duration Response:", ytResponse.data);
        ytResponse.data.items.forEach((item: any) => {
          const match = item.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const hours = parseInt(match?.[1] || "0") * 3600;
          const minutes = parseInt(match?.[2] || "0") * 60;
          const seconds = parseInt(match?.[3] || "0");
          durationMap[item.id] = hours + minutes + seconds;
        });
      } catch (error) {
        console.error("YouTube Duration Fetch Error:", error.response?.data || error.message);
      }
    }

    const trackIds = tracks
      .filter((t) => t.source === "spotify" && t.trackId)
      .map((t) => t.trackId!);
    if (trackIds.length > 0) {
      try {
        const spotifyAuth = await axios.post(
          "https://accounts.spotify.com/api/token",
          "grant_type=client_credentials",
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
            },
          }
        );
        const spotifyToken = spotifyAuth.data.access_token;

        const spotifyResponse = await axios.get(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(",")}`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });
        console.log("Spotify Duration Response:", spotifyResponse.data);
        spotifyResponse.data.tracks.forEach((track: any) => {
          durationMap[track.id] = Math.floor(track.duration_ms / 1000);
        });
      } catch (error) {
        console.error("Spotify Duration Fetch Error:", error.response?.data || error.message);
      }
    }

    console.log("Fetched Durations:", durationMap);
    setDurations(durationMap);
  };

  useEffect(() => {
    if (searchResults.length > 0) {
      console.log("Fetching durations for:", searchResults);
      fetchDurations(searchResults);
    }
  }, [searchResults]);

  const handleSelect = (item: MusicSnippet) => {
    setCurrentTrack(null);
    setPlaying(false);
    setCurrentTrack(item);
    setQueue(searchResults);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (searchResults.length === 0) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {playlistMetadata ? (
        <div className="mb-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            <Image
              src={playlistMetadata.thumbnail}
              alt="Playlist Cover"
              width={128}
              height={128}
              className="rounded object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{playlistMetadata.title}</h2>
              <div className="flex items-center gap-2">
                <Image
                  src={playlistMetadata.creatorThumbnail}
                  alt="Creator Logo"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <p className="text-sm text-gray-600">{playlistMetadata.creator}</p>
              </div>
              <p className="text-sm text-gray-500">{searchResults.length} songs</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Search Results</p>
      )}
      <div className="space-y-2">
        {searchResults.map((item, index) => {
          const id = item.videoId || item.trackId || "";
          const duration = durations[id] !== undefined ? formatDuration(durations[id]) : "N/A";
          return (
            <Card
              key={id || index}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(item)}
            >
              <CardContent className="p-2 flex items-center gap-2">
                <span className="text-gray-500 text-sm w-8">{index + 1}</span>
                <Image
                  src={item.snippet.thumbnails.default.url}
                  alt="Thumbnail"
                  width={48}
                  height={48}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.snippet.title}</p>
                  <p className="text-xs text-gray-600">{item.snippet.artist}</p>
                </div>
                <span className="text-xs text-gray-500">{duration}</span>
                <span className="text-xs text-gray-400">{item.snippet.source}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}