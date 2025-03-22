"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface UploadFormProps {
  onUpload: () => void
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [titles, setTitles] = useState<string[]>([])
  const [artists, setArtists] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(newFiles)

      // Initialize titles and artists from filenames
      const newTitles = newFiles.map((file) => {
        const parts = file.name.split("-")
        return parts[0]?.trim().replace(/\.[^/.]+$/, "") || ""
      })

      const newArtists = newFiles.map((file) => {
        const parts = file.name.split("-")
        return parts[1]?.trim().replace(/\.[^/.]+$/, "") || ""
      })

      setTitles(newTitles)
      setArtists(newArtists)
      setUploadProgress(newFiles.map(() => 0))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)
    abortControllerRef.current = new AbortController()

    try {
      // Upload files one by one to track individual progress
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append("files", files[i])
        formData.append(
          `title-${files[i].name}`,
          titles[i] ||
            files[i].name
              .split("-")[0]
              ?.trim()
              .replace(/\.[^/.]+$/, "") ||
            "Untitled",
        )
        formData.append(
          `artist-${files[i].name}`,
          artists[i] ||
            files[i].name
              .split("-")[1]
              ?.trim()
              .replace(/\.[^/.]+$/, "") ||
            "Unknown Artist",
        )

        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/upload", true)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            const newProgress = [...uploadProgress]
            newProgress[i] = progress
            setUploadProgress(newProgress)

            // Calculate overall progress
            const totalProgress = newProgress.reduce((acc, curr) => acc + curr, 0) / files.length
            setOverallProgress(totalProgress)
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            // File uploaded successfully
            const newProgress = [...uploadProgress]
            newProgress[i] = 100
            setUploadProgress(newProgress)

            // If this is the last file, finish the upload process
            if (i === files.length - 1) {
              finishUpload()
            }
          } else {
            toast.error(`Failed to upload ${files[i].name}: ${xhr.statusText}`)
            setUploading(false)
          }
        }

        xhr.onerror = () => {
          toast.error(`Error uploading ${files[i].name}`)
          setUploading(false)
        }

        xhr.send(formData)

        // Wait for this file to complete before starting the next one
        await new Promise<void>((resolve) => {
          xhr.onloadend = () => resolve()
        })
      }
    } catch (error) {
      toast.error("Failed to upload songs")
      setUploading(false)
    }
  }

  const finishUpload = () => {
    onUpload()
    setFiles([])
    setTitles([])
    setArtists([])
    setUploadProgress([])
    setOverallProgress(0)
    setUploading(false)
    toast.success("Songs uploaded successfully!")
  }

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setUploading(false)
    setUploadProgress(files.map(() => 0))
    setOverallProgress(0)
    toast.info("Upload cancelled")
  }

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

        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Overall Progress</p>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-xs text-right mt-1">{Math.round(overallProgress)}%</p>
          </div>
        )}

        {files.map((file, index) => (
          <div key={file.name} className="space-y-2 p-3 border rounded-md">
            <p className="text-sm text-gray-700">File: {file.name}</p>
            <Input
              placeholder="Title"
              value={titles[index]}
              onChange={(e) => {
                const newTitles = [...titles]
                newTitles[index] = e.target.value
                setTitles(newTitles)
              }}
              disabled={uploading}
              className="border-gray-300 rounded-md"
            />
            <Input
              placeholder="Artist"
              value={artists[index]}
              onChange={(e) => {
                const newArtists = [...artists]
                newArtists[index] = e.target.value
                setArtists(newArtists)
              }}
              disabled={uploading}
              className="border-gray-300 rounded-md"
            />

            {uploading && (
              <div>
                <Progress value={uploadProgress[index]} className="h-1.5" />
                <p className="text-xs text-right mt-1">{uploadProgress[index]}%</p>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={uploading || files.length === 0}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
          >
            {uploading ? "Uploading..." : "Upload Songs"}
          </Button>

          {uploading && (
            <Button type="button" variant="destructive" onClick={cancelUpload} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}