import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  try {
    const spotifyAuth = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64")}`,
        },
      }
    );
    const spotifyToken = spotifyAuth.data.access_token;

    const urlParams = new URLSearchParams(query.split("?")[1] || "");
    const playlistId = urlParams.get("list") || urlParams.get("playlist");
    const videoId = urlParams.get("v") || (query.includes("youtu.be") ? query.split("/").pop() : null);
    const spotifyTrackId = query.match(/track\/([a-zA-Z0-9]+)/)?.[1];
    const spotifyPlaylistId = query.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];

    if (playlistId || spotifyPlaylistId) {
      if (playlistId) {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
        const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
        const [playlistResponse, itemsResponse] = await Promise.all([fetch(playlistUrl), fetch(itemsUrl)]);
        const playlistData = await playlistResponse.json();
        const itemsData = await itemsResponse.json();

        const channelId = playlistData.items[0]?.snippet.channelId;
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();

        const playlistMetadata = playlistData.items[0]?.snippet
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

        return NextResponse.json({ items, playlist: playlistMetadata });
      } else if (spotifyPlaylistId) {
        const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });
        const playlistData = playlistResponse.data;

        const playlistMetadata = {
          title: playlistData.name,
          thumbnail: playlistData.images[0]?.url || "https://via.placeholder.com/120",
          creator: playlistData.owner.display_name,
          creatorThumbnail: playlistData.owner.images?.[0]?.url || "https://via.placeholder.com/32",
        };

        const items = playlistData.tracks.items.map((item: any) => ({
          snippet: {
            title: item.track.name,
            artist: item.track.artists[0].name,
            thumbnails: { default: { url: item.track.album.images[0]?.url || "https://via.placeholder.com/120" } },
            trackId: item.track.id,
            previewUrl: item.track.preview_url || null,
            source: "spotify",
          },
        }));

        return NextResponse.json({ items, playlist: playlistMetadata });
      }
    }

    if (videoId) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      const items = data.items.map((item: any) => ({
        snippet: {
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnails: item.snippet.thumbnails,
          videoId: item.id,
          source: "youtube",
        },
      }));
      return NextResponse.json({ items, playlist: null });
    } else if (spotifyTrackId) {
      const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      const trackData = trackResponse.data;
      const items = [{
        snippet: {
          title: trackData.name,
          artist: trackData.artists[0].name,
          thumbnails: { default: { url: trackData.album.images[0]?.url || "https://via.placeholder.com/120" } },
          trackId: trackData.id,
          previewUrl: trackData.preview_url || null,
          source: "spotify",
        },
      }];
      return NextResponse.json({ items, playlist: null });
    }

    const youtubeSearch = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const youtubeData = await youtubeSearch.json();
    const youtubeItems = youtubeData.items.map((item: any) => ({
      snippet: {
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        videoId: item.id.videoId,
        source: "youtube_music",
      },
    }));

    const spotifySearch = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });
    const spotifyItems = spotifySearch.data.tracks.items.map((item: any) => ({
      snippet: {
        title: item.name,
        artist: item.artists[0].name,
        thumbnails: { default: { url: item.album.images[0]?.url || "https://via.placeholder.com/120" } },
        trackId: item.id,
        previewUrl: item.preview_url || null,
        source: "spotify",
      },
    }));

    const items = [...youtubeItems, ...spotifyItems];
    return NextResponse.json({ items, playlist: null });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}