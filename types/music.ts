export interface MusicSnippet {
  title: string;
  artist: string;
  thumbnails: { default: { url: string } };
  videoId?: string;
  trackId?: string;
  source: "youtube" | "youtube_music" | "jiosaavn";
}

export interface PlaylistMetadata {
  title: string;
  thumbnail: string;
  creator: string;
  creatorThumbnail: string;
}