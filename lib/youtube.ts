import axios from "axios";
import { MusicSnippet, PlaylistMetadata } from "@/types/music";

export async function fetchYouTubeSearch(query: string, limit: number): Promise<MusicSnippet[]> {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: "snippet",
        type: "video",
        videoCategoryId: "10", // Music category
        maxResults: limit,
        q: query,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      },
    });
    return response.data.items.map((item: any) => ({
      snippet: {
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        videoId: item.id.videoId,
        source: "youtube_music",
      },
    }));
  } catch (error) {
    console.error("YouTube Search Error:", error);
    return [];
  }
}

export async function fetchYouTubePlaylist(playlistId: string, offset: number): Promise<{
  items: MusicSnippet[];
  playlistMetadata: PlaylistMetadata | null;
  total: number;
}> {
  try {
    const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
      params: {
        part: "snippet",
        id: playlistId,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      },
    });
    const itemsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
      params: {
        part: "snippet",
        maxResults: 50,
        playlistId,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
        pageToken: offset > 0 ? `offset=${offset}` : undefined,
      },
    });

    const playlistData = playlistResponse.data;
    const itemsData = itemsResponse.data;

    const channelId = playlistData.items[0]?.snippet.channelId;
    const channelResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
      params: {
        part: "snippet",
        id: channelId,
        key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      },
    });
    const channelData = channelResponse.data;

    const playlistMetadata: PlaylistMetadata = playlistData.items[0]?.snippet
      ? {
          title: playlistData.items[0].snippet.title,
          thumbnail: playlistData.items[0].snippet.thumbnails.default.url,
          creator: playlistData.items[0].snippet.channelTitle,
          creatorThumbnail: channelData.items[0]?.snippet.thumbnails.default.url || "https://via.placeholder.com/32",
        }
      : null;

    const items = itemsData.items.map((item: any) => ({
      snippet: {
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        videoId: item.snippet.resourceId.videoId,
        source: "youtube_music",
      },
    }));

    return { items, playlistMetadata, total: itemsData.pageInfo.totalResults };
  } catch (error) {
    console.error("YouTube Playlist Fetch Error:", error);
    return { items: [], playlistMetadata: null, total: 0 };
  }
}