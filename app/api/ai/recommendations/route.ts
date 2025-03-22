import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const likedSongs = await prisma.like.findMany({
      where: { userId },
    })

    // Extract track IDs from the track JSON
    const trackIds = likedSongs
      .map((like) => {
        // Safely handle the track object
        if (typeof like.track === "object" && like.track !== null) {
          const track = like.track as Record<string, any>
          return track.videoId || track.id || ""
        }
        return ""
      })
      .filter(Boolean)

    // Mock recommendations since xAI endpoint isn't available
    const mockRecommendations = trackIds.map((id) => ({
      trackId: `${id}-recommended`,
      title: `Recommended Song for ${id}`,
      artist: "AI Artist",
      source: "mock",
      videoId: `${id}-mock`,
      thumbnails: { default: { url: "https://placehold.co/120" } },
    }))

    return NextResponse.json({ recommendations: mockRecommendations })
  } catch (error) {
    console.error("AI Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 })
  }
}

