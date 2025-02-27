export interface YouTubeVideoSnippet {
  title: string;
  channelTitle: string; // Fallback artist name
  thumbnails: { default: { url: string } };
  resourceId?: { videoId: string };
  videoOwnerChannelTitle?: string; // Actual artist for playlist items
  videoOwnerChannelId?: string; // For potential future use
}

export interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: YouTubeVideoSnippet;
}

export interface YouTubePlaylistItem {
  snippet: YouTubeVideoSnippet;
}

export interface YouTubeResponse {
  items: (YouTubeSearchItem | YouTubePlaylistItem)[];
}

export interface YouTubeVideoResponse {
  items: [{ snippet: YouTubeVideoSnippet }];
}

export interface PlaylistMetadata {
  title: string;
  thumbnail: string;
  creator: string;
  creatorThumbnail: string;
}