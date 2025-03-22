"use client"

import { useState, forwardRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { useAudioStore } from "@/store/audioStore"
import { useUser } from "@clerk/nextjs"
import { UploadDialog } from "@/components/ui/upload-dialog"
import { AuthDialog } from "@/components/ui/auth-dialog"

interface SearchBarProps {
  onSearch: (query: string) => void
  onFocus?: () => void
  onUploadComplete?: () => void
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ onSearch, onFocus, onUploadComplete }, ref) => {
  const [query, setQuery] = useState<string>("")
  const { loading } = useAudioStore()
  const { isSignedIn } = useUser()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim())
      setQuery("")
    }
  }

  const handleUploadClick = () => {
    if (!isSignedIn) {
      setShowAuthDialog(true)
    } else {
      setShowUploadDialog(true)
    }
  }

  const handleUploadComplete = () => {
    setShowUploadDialog(false)
    if (onUploadComplete) {
      onUploadComplete()
    }
  }

  // Add keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        if (ref && "current" in ref && ref.current) {
          ref.current.focus()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [ref])

  return (
    <>
      <div className="flex gap-2 p-4 max-w-3xl mx-auto">
        <Input
          placeholder="Search song or paste playlist URL... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          ref={ref}
          onFocus={onFocus}
        />
        <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
        <Button onClick={handleUploadClick} variant="outline" className="flex items-center gap-2" title="Upload songs">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        title="Authentication Required"
        description="You need to be logged in to upload songs. Would you like to sign in now?"
        actionType="upload"
        onComplete={() => {
          setShowAuthDialog(false)
          if (isSignedIn) {
            setShowUploadDialog(true)
          }
        }}
      />
    </>
  )
})

SearchBar.displayName = "SearchBar"

export default SearchBar