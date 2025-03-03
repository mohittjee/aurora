import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const likedSongs = await prisma.like.findMany({
      where: { userId },
      select: { trackId: true },
    });

    const trackIds = likedSongs.map((like) => like.trackId);
    const response = await axios.post(
      "https://api.x.ai/v1/recommendations",
      { trackIds },
      { headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` } }
    );

    const recommendations = response.data.recommendations.map((item: any) => ({
      title: item.title,
      artist: item.artist,
      thumbnails: { default: { url: item.thumbnail || "https://via.placeholder.com/120" } },
      videoId: item.url,
      source: "jiosaavn",
    }));

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}