import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlists = await prisma.playlist.findMany({ where: { userId } });
  return NextResponse.json(playlists);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, tracks } = await req.json();
  const playlist = await prisma.playlist.create({
    data: { userId, name, tracks },
  });
  return NextResponse.json(playlist);
}