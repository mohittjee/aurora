"use client";

import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { Download } from "lucide-react";

interface DownloadButtonProps {
  trackId: string;
  source: string;
}

export default function DownloadButton({ trackId, source }: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download?trackId=${encodeURIComponent(trackId)}&source=${source}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${trackId}.mp3`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      alert("Failed to download song");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDownload} className="text-blue-600 hover:text-blue-800">
      <Download className="h-4 w-4" />
    </Button>
  );
}