import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { fetchJioSaavnTracks } from "@/lib/jiosaavn";
import { fetchYouTubeSearch, fetchYouTubePlaylist } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

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
        const { items, playlistMetadata, total } = await fetchYouTubePlaylist(playlistId, offset);
        return NextResponse.json({ items, playlist: playlistMetadata, total });
      } else if (spotifyPlaylistId) {
        console.log(`Fetching Spotify playlist ${spotifyPlaylistId} with offset ${offset}`);
        const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
          params: { offset, limit: 50 },
        });
        const playlistData = playlistResponse.data;

        const metadataResponse = await axios.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`, {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        });
        const metadata = metadataResponse.data;

        const playlistMetadata = {
          title: metadata.name,
          thumbnail: metadata.images[0]?.url || "https://via.placeholder.com/120",
          creator: metadata.owner.display_name,
          creatorThumbnail: metadata.owner.images?.[0]?.url || "https://via.placeholder.com/32",
        };

        const itemsPromises = playlistData.items.map(async (item: any) => {
          const track = item.track;
          const jioSaavnResult = await fetchJioSaavnTracks(`${track.name} ${track.artists[0].name}`, 1);
          let videoId = jioSaavnResult[0]?.videoId || "";

          if (!videoId) {
            const proxyResult = await axios.get(`https://music-player-proxy.onrender.com/youtube?query=${encodeURIComponent(`${track.name} ${track.artists[0].name}`)}&limit=1`);
            videoId = proxyResult.data.videoId || "";
          }

          if (!videoId) {
            const youtubeResult = await fetchYouTubeSearch(`${track.name} ${track.artists[0].name}`, 1);
            videoId = youtubeResult[0]?.videoId || "";
          }

          return {
            snippet: {
              title: track.name,
              artist: track.artists[0].name,
              thumbnails: { default: { url: track.album.images[0]?.url || "https://via.placeholder.com/120" } },
              videoId,
              source: videoId && videoId.includes("youtube") ? "youtube_music" : "jiosaavn",
            },
          };
        });

        const items = await Promise.all(itemsPromises);
        console.log(`Fetched ${items.length} items from Spotify playlist at offset ${offset}`);
        return NextResponse.json({
          items,
          playlist: playlistMetadata,
          total: playlistData.total,
        });
      }
    }

    if (videoId) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) throw new Error(data.error.message || "YouTube API error");

      const items = data.items.map((item: any) => ({
        snippet: {
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnails: item.snippet.thumbnails,
          videoId: item.id,
          source: "youtube",
        },
      }));
      return NextResponse.json({ items, playlist: null, total: items.length });
    } else if (spotifyTrackId) {
      const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      const trackData = trackResponse.data;

      const jioSaavnResult = await fetchJioSaavnTracks(`${trackData.name} ${trackData.artists[0].name}`, 1);
      let videoId = jioSaavnResult[0]?.videoId || "";

      if (!videoId) {
        const proxyResult = await axios.get(`https://music-player-proxy.onrender.com/youtube?query=${encodeURIComponent(`${trackData.name} ${trackData.artists[0].name}`)}&limit=1`);
        videoId = proxyResult.data.videoId || "";
      }

      if (!videoId) {
        const youtubeResult = await fetchYouTubeSearch(`${trackData.name} ${trackData.artists[0].name}`, 1);
        videoId = youtubeResult[0]?.videoId || "";
      }

      const items = [{
        snippet: {
          title: trackData.name,
          artist: trackData.artists[0].name,
          thumbnails: { default: { url: trackData.album.images[0]?.url || "https://via.placeholder.com/120" } },
          videoId,
          source: videoId && videoId.includes("youtube") ? "youtube_music" : "jiosaavn",
        },
      }];
      return NextResponse.json({ items, playlist: null, total: 1 });
    }

    if (!query) throw new Error("Query parameter is required for search");

    const jioSaavnItems = await fetchJioSaavnTracks(query, 5);
    const remainingSlots = 5 - jioSaavnItems.length;
    let youtubeItems: any[] = [];
    if (remainingSlots > 0) {
      const proxyResult = await axios.get(`https://music-player-proxy.onrender.com/youtube?query=${encodeURIComponent(query)}&limit=${remainingSlots}`);
      youtubeItems = proxyResult.data.items.length >= remainingSlots ? proxyResult.data.items.slice(0, remainingSlots) : proxyResult.data.items;

      if (youtubeItems.length < remainingSlots) {
        const youtubeResult = await fetchYouTubeSearch(query, remainingSlots - youtubeItems.length);
        youtubeItems = [...youtubeItems, ...youtubeResult];
      }
    }

    const items = [...jioSaavnItems, ...youtubeItems.map(item => ({ snippet: item.snippet }))]; // Wrap items in snippet for consistency
    return NextResponse.json({ items, playlist: null, total: items.length });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
  }
}