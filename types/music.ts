export interface MusicSnippet {
  title: string
  artist: string
  thumbnails: { default: { url: string } }
  videoId?: string
  trackId?: string
  source: string
  filePath?: string
  id?: string // Added for compatibility with liked songs
  // Add new properties for preserving original data
  originalTitle?: string
  originalArtist?: string
  originalThumbnail?: string
  originalTrackId?: string
}

export interface PlaylistMetadata {
  title: string
  thumbnail: string
  creator: string
  creatorThumbnail: string
  link?: string // Added to store original link
}

export type PlayMode = "normal" | "shuffle" | "single" | "loop"

