import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions); // Use NextAuth's getServerSession
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const likedSongs = await prisma.like.findMany({
      where: { userId: session.user.id },
      select: { trackId: true },
    });

    const trackIds = likedSongs.map((like) => like.trackId);
    const response = await axios.post(
      "https://api.x.ai/v1/recommendations", // Hypothetical Grok API endpoint
      { trackIds },
      { headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` } }
    );

    const recommendations = response.data.recommendations.map((item: any) => ({
      snippet: {
        title: item.title,
        artist: item.artist,
        thumbnails: { default: { url: item.thumbnail || "https://via.placeholder.com/120" } },
        videoId: item.url,
        source: "jiosaavn", // Assuming Grok returns JioSaavn-like data
      },
    }));

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}