import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { fetchJioSaavnTracks } from "@/lib/jiosaavn"
import { fetchYouTubeSearch, fetchYouTubePlaylist } from "@/lib/youtube"

// In-memory cache (use Redis in production)
const cache: Record<string, { items: any[]; playlist: any; total: number; timestamp: number; stage: string }> = {}
const CACHE_TTL = 60 * 60 * 1000 // 1 hour TTL

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET

  try {
    // Improved platform detection
    const isYoutubeUrl = query.includes("youtube.com") || query.includes("youtu.be")
    const isSpotifyUrl = query.includes("spotify.com")
    const isJioSaavnUrl = query.includes("jiosaavn.com") || query.includes("saavn.com")

    const urlParams = new URLSearchParams(query.split("?")[1] || "")
    const youtubePlaylistId = isYoutubeUrl ? urlParams.get("list") || urlParams.get("playlist") : null
    const youtubeVideoId = isYoutubeUrl
      ? urlParams.get("v") || (query.includes("youtu.be") ? query.split("/").pop() : null)
      : null
    const spotifyTrackId = isSpotifyUrl ? query.match(/track\/([a-zA-Z0-9]+)/)?.[1] : null
    const spotifyPlaylistId = isSpotifyUrl ? query.match(/playlist\/([a-zA-Z0-9]+)/)?.[1] : null
    const jiosaavnSongId = isJioSaavnUrl ? query.match(/song\/([a-zA-Z0-9]+)/)?.[1] : null
    const jiosaavnAlbumId = isJioSaavnUrl ? query.match(/album\/([a-zA-Z0-9]+)/)?.[1] : null
    const isKeywordSearch =
      !youtubePlaylistId &&
      !youtubeVideoId &&
      !spotifyTrackId &&
      !spotifyPlaylistId &&
      !jiosaavnSongId &&
      !jiosaavnAlbumId &&
      query.trim().length > 0

    // Enhanced caching with TTL check
    const cacheKey = `${query}-${offset}-${limit}`
    if (cache[cacheKey]) {
      const cachedData = cache[cacheKey]
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        console.log(`Cache hit for ${cacheKey}`)
        return NextResponse.json(cachedData)
      } else {
        console.log(`Cache expired for ${cacheKey}`)
        // Cache expired, delete it
        delete cache[cacheKey]
      }
    }

    let items: any[] = []
    let playlistMetadata = null
    let total = 0
    let stage = "initializing"

    // Get Spotify token if needed
    let spotifyToken = null
    if (isSpotifyUrl || isKeywordSearch) {
      stage = "authenticating_spotify"
      const spotifyAuth = await axios.post("https://accounts.spotify.com/api/token", "grant_type=client_credentials", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64")}`,
        },
      })
      spotifyToken = spotifyAuth.data.access_token
    }

    if (youtubePlaylistId) {
      stage = "fetching_youtube_playlist"
      const {
        items: ytItems,
        playlistMetadata: ytMeta,
        total: ytTotal,
      } = await fetchYouTubePlaylist(youtubePlaylistId, offset)

      // Filter out items with missing data
      items = ytItems.filter((item) => item.title && item.artist && item.thumbnails?.default?.url)

      playlistMetadata = {
        ...ytMeta,
        link: query, // Store the original link
      }
      total = ytTotal
    } else if (youtubeVideoId) {
      stage = "fetching_youtube_video"
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeVideoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.error) throw new Error(data.error.message || "YouTube API error")

      items = data.items
        .filter((item: any) => item.snippet && item.snippet.title)
        .map((item: any) => ({
          title: item.snippet.title || "Unknown Title",
          artist: item.snippet.channelTitle || "Unknown Artist",
          thumbnails: { default: { url: item.snippet.thumbnails?.default?.url || "https://placehold.co/120" } },
          videoId: item.id,
          source: "youtube",
        }))
      total = items.length
    } else if (spotifyPlaylistId) {
      stage = "fetching_spotify_playlist"
      const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
        params: { offset, limit },
      })
      const playlistData = playlistResponse.data

      const metadataResponse = await axios.get(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
      const metadata = metadataResponse.data

      playlistMetadata = {
        title: metadata.name,
        thumbnail: metadata.images[0]?.url || "https://placehold.co/120",
        creator: metadata.owner.display_name,
        creatorThumbnail: metadata.owner.images?.[0]?.url || "./user.svg",
        link: query, // Store the original link
      }

      items = playlistData.items
        .filter((item: any) => item.track && item.track.name)
        .map((item: any) => ({
          title: item.track.name || "Unknown Title",
          artist: item.track.artists.map((a: any) => a.name).join(", ") || "Unknown Artist",
          thumbnails: { default: { url: item.track.album.images[0]?.url || "https://placehold.co/120" } },
          videoId: "", // Placeholder
          source: "spotify",
        }))
      total = playlistData.total
    } else if (spotifyTrackId) {
      stage = "fetching_spotify_track"
      const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyTrackId}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
      const trackData = trackResponse.data
      items = [
        {
          title: trackData.name || "Unknown Title",
          artist: trackData.artists.map((a: any) => a.name).join(", ") || "Unknown Artist",
          thumbnails: { default: { url: trackData.album.images[0]?.url || "https://placehold.co/120" } },
          videoId: "", // Placeholder
          source: "spotify",
        },
      ]
      total = 1
    } else if (jiosaavnSongId) {
      stage = "fetching_jiosaavn_song"
      try {
        const response = await axios.get(`https://saavn.dev/api/songs/${jiosaavnSongId}`)
        const data = response.data.data.results[0]
        items = [
          {
            title: data.name || "Unknown Title",
            artist: data.artists.primary.map((a: any) => a.name).join(", ") || "Unknown Artist",
            thumbnails: {
              default: {
                url: data.image.find((img: any) => img.quality === "500x500")?.url || "https://placehold.co/120",
              },
            },
            videoId: data.downloadUrl.find((url: any) => url.quality === "320kbps")?.url || data.url,
            source: "jiosaavn",
          },
        ]
        total = 1
      } catch (error) {
        console.error("JioSaavn song fetch error:", error)
        items = []
        total = 0
      }
    } else if (jiosaavnAlbumId) {
      stage = "fetching_jiosaavn_album"
      try {
        const response = await axios.get(`https://saavn.dev/api/albums/${jiosaavnAlbumId}`)
        const data = response.data.data

        items = data.songs
          .filter((song: any) => song.name && song.artists)
          .map((song: any) => ({
            title: song.name || "Unknown Title",
            artist: song.artists.primary.map((a: any) => a.name).join(", ") || "Unknown Artist",
            thumbnails: {
              default: {
                url: song.image.find((img: any) => img.quality === "500x500")?.url || "https://placehold.co/120",
              },
            },
            videoId: song.downloadUrl.find((url: any) => url.quality === "320kbps")?.url || song.url,
            source: "jiosaavn",
          }))

        playlistMetadata = {
          title: data.name,
          thumbnail: data.image.find((img: any) => img.quality === "500x500")?.url || "https://placehold.co/120",
          creator: data.artists.primary.map((a: any) => a.name).join(", ") || "Unknown Artist",
          creatorThumbnail: "https://placehold.co/32",
          link: query, // Store the original link
        }
        total = items.length
      } catch (error) {
        console.error("JioSaavn album fetch error:", error)
        items = []
        total = 0
      }
    } else if (isKeywordSearch) {
      // Fetch from all sources in parallel
      stage = "searching_jiosaavn"
      const jioSaavnPromise = fetchJioSaavnTracks(query, 3).catch((err) => {
        console.error("JioSaavn search error:", err)
        return []
      })

      stage = "searching_youtube"
      const youtubePromise = axios
        .get(
          `https://music-player-proxy-production.up.railway.app/youtube?query=${encodeURIComponent(query)}&limit=2`,
          { timeout: 5000 }, // Add timeout to prevent long waits
        )
        .then((res) => res.data.items?.slice(0, 2) || [])
        .catch((err) => {
          console.error("Proxy fetch error:", err)
          return fetchYouTubeSearch(query, 2).catch((err) => {
            console.error("YouTube API error:", err)
            return []
          })
        })

      stage = "searching_spotify"
      const spotifyPromise = axios
        .get("https://api.spotify.com/v1/search", {
          headers: { Authorization: `Bearer ${spotifyToken}` },
          params: { q: query, type: "track", limit: 2 },
        })
        .then((res) =>
          res.data.tracks.items.map((track: any) => ({
            title: track.name || "Unknown Title",
            artist: track.artists.map((a: any) => a.name).join(", ") || "Unknown Artist",
            thumbnails: { default: { url: track.album.images[0]?.url || "https://placehold.co/120" } },
            videoId: "", // Placeholder
            source: "spotify",
          })),
        )
        .catch((err) => {
          console.error("Spotify search error:", err)
          return []
        })

      // Wait for all promises to resolve
      stage = "processing_results"
      const [jioSaavnItems, youtubeItems, spotifyItems] = await Promise.all([
        jioSaavnPromise,
        youtubePromise,
        spotifyPromise,
      ])

      items = [...jioSaavnItems, ...youtubeItems, ...spotifyItems].filter((item) => item.title && item.artist) // Filter out items with missing data
      total = items.length
    } else {
      throw new Error("Invalid query or unsupported platform")
    }

    const responseData = { items, playlist: playlistMetadata, total, stage }
    cache[cacheKey] = { ...responseData, timestamp: Date.now() }
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("API Error in /api/music:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch data",
        stage: "error",
      },
      { status: 500 },
    )
  }
}

