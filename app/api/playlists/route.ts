import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/lib/clerkSync";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await syncClerkUser(clerkUser);

  const body = await req.json();
  const { name, tracks, link } = body; // Add link

  if (!name || !tracks || !Array.isArray(tracks)) {
    return NextResponse.json({ error: "Invalid payload: name and tracks required" }, { status: 400 });
  }

  try {
    const existingPlaylist = await prisma.playlist.findFirst({
      where: { userId, name },
    });
    if (existingPlaylist) {
      return NextResponse.json({ error: "Playlist with this name already exists" }, { status: 409 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name,
        link: link || null, // Store link if provided
        tracks: { tracks },
      },
    });
    return NextResponse.json({ success: true, playlist }, { status: 201 });
  } catch (error) {
    console.error("Error saving playlist:", error);
    return NextResponse.json({ error: "Failed to save playlist" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId },
    });
    return NextResponse.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}