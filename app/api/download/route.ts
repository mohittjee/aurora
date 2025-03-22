import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Clerk auth helper
import { fetchJioSaavnTracks } from "@/lib/jiosaavn";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  const source = searchParams.get("source");
  const quality = searchParams.get("quality") || "320kbps";

  if (!trackId || !source) {
    return NextResponse.json({ error: "Missing trackId or source" }, { status: 400 });
  }

  const { userId } = await auth(); // Await auth to get userId
  // No need to check userId here unless you want to restrict downloads to authenticated users

  try {
    let url = "";
    if (source === "jiosaavn") {
      const jioSaavnResult = await fetchJioSaavnTracks(trackId, 1);
      url = jioSaavnResult[0]?.videoId || "";
    }

    if (!url && source === "youtube_music") {
      const proxyResponse = await axios.get(`https://music-player-proxy-production.up.railway.app/youtube?query=${encodeURIComponent(trackId)}&limit=1`);
      url = proxyResponse.data.videoId ? `https://www.youtube.com/watch?v=${proxyResponse.data.videoId}` : "";
    }

    if (!url) {
      throw new Error("No downloadable URL found");
    }

    const response = await axios.get(url, { responseType: "stream" });
    const fileName = `${trackId}-${quality}.mp3`;

    if (userId) {
      await prisma.download.create({
        data: { userId, trackId, filePath: fileName },
      });
    }

    return new NextResponse(response.data, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: any) {
    console.error("Download Error:", error);
    return NextResponse.json({ error: error.message || "Failed to download song" }, { status: 500 });
  }
}