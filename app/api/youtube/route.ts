import { NextRequest, NextResponse } from "next/server";
import { YouTubeResponse, YouTubeVideoResponse } from "@/types/youtube";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  try {
    const urlParams = new URLSearchParams(query.split("?")[1] || "");
    const playlistId = urlParams.get("list");

    if (playlistId) {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
      const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

      const [playlistResponse, itemsResponse] = await Promise.all([
        fetch(playlistUrl),
        fetch(itemsUrl),
      ]);

      const playlistData: any = await playlistResponse.json();
      const itemsData: YouTubeResponse = await itemsResponse.json();

      // Fetch creator channel thumbnail
      const channelId = playlistData.items[0]?.snippet.channelId;
      let creatorThumbnail = "https://via.placeholder.com/32"; // Fallback
      if (channelId) {
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();
        creatorThumbnail = channelData.items[0]?.snippet.thumbnails.default.url || creatorThumbnail;
      }

      const playlistMetadata = playlistData.items[0]?.snippet
        ? {
            title: playlistData.items[0].snippet.title,
            thumbnail: playlistData.items[0].snippet.thumbnails.default.url,
            creator: playlistData.items[0].snippet.channelTitle,
            creatorThumbnail,
          }
        : null;

      return NextResponse.json({
        items: itemsData.items,
        playlist: playlistMetadata,
      });
    }

    const videoId = urlParams.get("v") || (query.includes("youtu.be") ? query.split("/").pop() : null);
    if (videoId) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const response = await fetch(url);
      const data: YouTubeVideoResponse = await response.json();
      return NextResponse.json({ items: data.items, playlist: null });
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(searchUrl);
    const data: YouTubeResponse = await response.json();
    return NextResponse.json({ items: data.items, playlist: null });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}