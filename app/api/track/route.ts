import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { fetchJioSaavnTracks } from "@/lib/jiosaavn"
import { fetchYouTubeSearch } from "@/lib/youtube"
import type { MusicSnippet } from "@/types/music"

// Add a simple in-memory cache for tracks
const trackCache: Record<string, { track: MusicSnippet; timestamp: number }> = {}
const TRACK_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") || "Unknown Title"
  const artist = searchParams.get("artist") || "Unknown Artist"
  const query = `${title} ${artist}`.trim()
  const cacheKey = `track:${query}`

  // Check cache first
  if (trackCache[cacheKey] && Date.now() - trackCache[cacheKey].timestamp < TRACK_CACHE_TTL) {
    console.log(`Track cache hit for ${query}`)
    return NextResponse.json(trackCache[cacheKey].track)
  }

  try {
    let bestTrack: MusicSnippet | null = null
    let stage = "initializing"

    // 1. Try JioSaavn first
    stage = "trying_jiosaavn"
    try {
      console.log("Fetching from JioSaavn:", query)
      const jioSaavnResult = await fetchJioSaavnTracks(query, 1)
      if (jioSaavnResult[0] && isGoodMatch(jioSaavnResult[0], title, artist)) {
        bestTrack = jioSaavnResult[0]
        console.log("Found match on JioSaavn")
      }
    } catch (error) {
      console.error("JioSaavn fetch error:", error)
    }

    // 2. Try proxy second
    if (!bestTrack) {
      stage = "trying_proxy"
      try {
        console.log("Fetching from proxy:", query)
        const proxyResult = await axios.get(
          `https://music-player-proxy-production.up.railway.app/youtube?query=${encodeURIComponent(query)}&limit=1`,
          { timeout: 5000 }, // Add timeout to prevent long waits
        )
        const proxyTrack = proxyResult.data.items?.[0]
        if (proxyTrack && isGoodMatch(proxyTrack, title, artist)) {
          bestTrack = proxyTrack
          console.log("Found match on proxy")
        }
      } catch (error) {
        console.error("Proxy fetch error:", error)
      }
    }

    // 3. Try YouTube API as last resort
    if (!bestTrack) {
      stage = "trying_youtube_api"
      try {
        console.log("Fetching from YouTube API:", query)
        const youtubeResult = await fetchYouTubeSearch(query, 1)
        if (youtubeResult[0]) {
          bestTrack = youtubeResult[0]
          console.log("Found match on YouTube API")
        }
      } catch (error) {
        console.error("YouTube API error:", error)
      }
    }

    if (!bestTrack) {
      // Create a fallback track with the provided title and artist
      bestTrack = {
        title: title,
        artist: artist,
        thumbnails: { default: { url: "https://placehold.co/120" } },
        videoId: "", // Empty videoId will be handled by the player
        source: "unknown",
      }
      console.log("No match found, using fallback track")
    }

    // Cache the result
    trackCache[cacheKey] = { track: bestTrack, timestamp: Date.now() }

    // Limit cache size using LRU approach
    const MAX_CACHE_SIZE = 15
    if (Object.keys(trackCache).length > MAX_CACHE_SIZE) {
      const oldestKey = Object.entries(trackCache).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0]
      delete trackCache[oldestKey]
      console.log(`Removed oldest track from cache: ${oldestKey}`)
    }

    return NextResponse.json(bestTrack)
  } catch (error) {
    console.error("Track Fetch Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch track",
        title: title,
        artist: artist,
        thumbnails: { default: { url: "https://placehold.co/120" } },
        source: "error",
      },
      { status: 500 },
    )
  }
}

function isGoodMatch(track: MusicSnippet, title: string, artist: string): boolean {
  if (!track.videoId) return false

  const titleLower = title.toLowerCase()
  const artistLower = artist.toLowerCase()
  const trackTitleLower = track.title.toLowerCase()
  const trackArtistLower = track.artist.toLowerCase()

  // Accept if either title or artist partially matches, and videoId exists
  const titleMatch = trackTitleLower.includes(titleLower) || titleLower.includes(trackTitleLower)
  const artistMatch = trackArtistLower.includes(artistLower) || artistLower.includes(trackArtistLower)
  return titleMatch || artistMatch
}