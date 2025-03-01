import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // Updated import
import { authOptions } from "@/lib/auth"; // Ensure this path is correct
import { uploadToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions); // Use NextAuth's getServerSession
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const uploads = [];

    for (const file of files) {
      const fileName = file.name;
      const [title, artist] = fileName.split("-").map((part) => part.trim().replace(/\.[^/.]+$/, "")) || [fileName, "Unknown Artist"];
      const s3FileName = `${session.user.id}-${Date.now()}-${fileName}`;
      const fileUrl = await uploadToS3(file, s3FileName);

      const upload = await prisma.upload.create({
        data: {
          userId: session.user.id,
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