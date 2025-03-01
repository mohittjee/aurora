"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UploadFormProps {
  onUpload: () => void;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      setTitles(newFiles.map(() => ""));
      setArtists(newFiles.map(() => ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("files", file);
      formData.append(`title-${file.name}`, titles[index] || file.name.split("-")[0]?.trim().replace(/\.[^/.]+$/, "") || "Untitled");
      formData.append(`artist-${file.name}`, artists[index] || file.name.split("-")[1]?.trim().replace(/\.[^/.]+$/, "") || "Unknown Artist");
    });

    try {
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      onUpload();
      setFiles([]);
      setTitles([]);
      setArtists([]);
      alert("Songs uploaded successfully!");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload songs");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Upload Songs</h2>
      <div className="space-y-4">
        <Input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="border-gray-300 rounded-md"
        />
        {files.map((file, index) => (
          <div key={file.name} className="space-y-2">
            <p className="text-sm text-gray-700">File: {file.name}</p>
            <Input
              placeholder="Title"
              value={titles[index]}
              onChange={(e) => {
                const newTitles = [...titles];
                newTitles[index] = e.target.value;
                setTitles(newTitles);
              }}
              disabled={uploading}
              className="border-gray-300 rounded-md"
            />
            <Input
              placeholder="Artist"
              value={artists[index]}
              onChange={(e) => {
                const newArtists = [...artists];
                newArtists[index] = e.target.value;
                setArtists(newArtists);
              }}
              disabled={uploading}
              className="border-gray-300 rounded-md"
            />
          </div>
        ))}
        <Button
          type="submit"
          disabled={uploading || files.length === 0}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {uploading ? "Uploading..." : "Upload Songs"}
        </Button>
      </div>
    </form>
  );
}