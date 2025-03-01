import axios from "axios";
import { MusicSnippet } from "@/types/music";

export async function fetchGrokRecommendations(trackIds: string[]): Promise<MusicSnippet[]> {
  try {
    const response = await axios.post(
      "https://api.x.ai/v1/recommendations", // Hypothetical endpoint based on xAI docs
      { trackIds },
      { 
        headers: { 
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json"
        } 
      }
    );

    // Assuming Grok API returns a list of recommended tracks with title, artist, and URL
    return response.data.recommendations.map((item: any) => ({
      snippet: {
        title: item.title,
        artist: item.artist,
        thumbnails: { default: { url: item.thumbnail || "https://via.placeholder.com/120" } },
        videoId: item.url, // Assuming URL is provided
        source: "jiosaavn", // Defaulting to JioSaavn-like source
      },
    }));
  } catch (error) {
    console.error("Grok Recommendations Error:", error);
    return []; // Fallback to empty array on error
  }
}