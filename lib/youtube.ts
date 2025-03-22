// lib/youtube.ts
import axios from "axios";
import { MusicSnippet } from "@/types/music";

export async function fetchYouTubeSearch(query: string, limit: number): Promise<MusicSnippet[]> {
  const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
    params: {
      part: "snippet",
      type: "video",
      q: query,
      maxResults: limit,
      key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    },
  });
  return response.data.items.map((item: any) => ({
    title: item.snippet.title || "Unknown Title",
    artist: item.snippet.channelTitle || "Unknown Artist",
    thumbnails: { default: { url: item.snippet.thumbnails?.default?.url || "https://placehold.co/120" } },
    videoId: item.id.videoId,
    source: "youtube",
  }));
}

export async function fetchYouTubePlaylist(playlistId: string, offset: number): Promise<{
  items: MusicSnippet[];
  playlistMetadata: { title: string; thumbnail: string; creator: string; creatorThumbnail: string };
  total: number;
}> {
  const response = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
    params: {
      part: "snippet",
      playlistId,
      maxResults: 50,
      pageToken: offset > 0 ? undefined : undefined,
      key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    },
  });

  const playlistResponse = await axios.get("https://www.googleapis.com/youtube/v3/playlists", {
    params: {
      part: "snippet",
      id: playlistId,
      key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    },
  });

  const items = response.data.items.map((item: any) => ({
    title: item.snippet.title || "Unknown Title",
    artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || "Unknown Artist",
    thumbnails: { default: { url: item.snippet.thumbnails?.default?.url || "https://placehold.co/120" } },
    videoId: item.snippet.resourceId.videoId,
    source: "youtube",
  }));

  const playlistData = playlistResponse.data.items[0].snippet;
  const playlistMetadata = {
    title: playlistData.title,
    thumbnail: playlistData.thumbnails?.default?.url || "https://placehold.co/120",
    creator: playlistData.channelTitle,
    creatorThumbnail: playlistData.thumbnails?.default?.url || "https://placehold.co/32",
  };

  return { items, playlistMetadata, total: response.data.pageInfo.totalResults };
}