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
  const { track } = body; // Expect full track object

  if (!track || typeof track !== "object") {
    return NextResponse.json({ error: "Invalid payload: track object required" }, { status: 400 });
  }

  try {
    const existingLike = await prisma.like.findFirst({
      where: { userId, track: { equals: track } }, // Compare JSON
    });
    if (existingLike) {
      return NextResponse.json({ error: "Song already liked" }, { status: 409 });
    }

    const like = await prisma.like.create({
      data: {
        userId,
        track,
      },
    });
    return NextResponse.json({ success: true, like }, { status: 201 });
  } catch (error) {
    console.error("Error liking song:", error);
    return NextResponse.json({ error: "Failed to like song" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const likes = await prisma.like.findMany({
      where: { userId },
    });
    return NextResponse.json(likes.map((like) => like.track)); // Return track objects
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
  }
}