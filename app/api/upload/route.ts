import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Clerk auth helper
import { uploadToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId } = await auth(); // Get user ID from Clerk
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const uploads = [];

    for (const file of files) {
      const fileName = file.name;
      const [title, artist] = fileName.split("-").map((part) => part.trim().replace(/\.[^/.]+$/, "")) || [fileName, "Unknown Artist"];
      const s3FileName = `${userId}-${Date.now()}-${fileName}`;
      const fileUrl = await uploadToS3(file, s3FileName);

      const upload = await prisma.upload.create({
        data: {
          userId, // Use Clerk userId
          filePath: fileUrl,
          title: formData.get(`title-${fileName}`) as string || title,
          artist: formData.get(`artist-${fileName}`) as string || artist,
        },
      });
      uploads.push(upload);
    }

    return NextResponse.json({ message: "Uploads successful", uploads });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload songs" }, { status: 500 });
  }
}