export interface MusicSnippet {
    title: string;
    artist: string;
    thumbnails: { default: { url: string } };
    videoId?: string; // YouTube/YouTube Music
    trackId?: string; // Spotify
    previewUrl?: string; // Spotify preview URL
    source: "youtube" | "youtube_music" | "spotify";
  }
  
  export interface PlaylistMetadata {
    title: string;
    thumbnail: string;
    creator: string;
    creatorThumbnail: string;
  }
  
  export interface SearchResult {
    snippet: MusicSnippet;
  }