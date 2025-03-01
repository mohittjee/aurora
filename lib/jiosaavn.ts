import axios from "axios";
import { MusicSnippet } from "@/types/music";

export async function fetchJioSaavnTracks(query: string, limit: number): Promise<MusicSnippet[]> {
  try {
    const response = await axios.get(`https://saavn.me/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data.results.map((item: any) => ({
      snippet: {
        title: item.name,
        artist: item.primaryArtists,
        thumbnails: { default: { url: item.image.find((img: any) => img.quality === "500x500")?.link || "https://via.placeholder.com/120" } },
        videoId: item.downloadUrl.find((url: any) => url.quality === "320kbps")?.link || item.downloadUrl[0]?.link || "",
        source: "jiosaavn",
      },
    }));
  } catch (error) {
    console.error("JioSaavn Fetch Error:", error);
    return [];
  }
}