import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Clerk auth helper
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth(); // Get user ID from Clerk
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploads = await prisma.upload.findMany({ where: { userId } });
  return NextResponse.json(uploads);
}