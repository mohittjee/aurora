import axios from "axios";
import { MusicSnippet } from "@/types/music";

export async function fetchJioSaavnTracks(query: string, limit: number): Promise<MusicSnippet[]> {
  try {
    const response = await axios.get(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    console.log("JioSaavn Response:", response.data);

    if (!response.data?.success || !Array.isArray(response.data?.data?.results)) {
      console.error("JioSaavn API returned unexpected structure:", response.data);
      return [];
    }

    const results = response.data.data.results;
    return results.map((item: any) => ({
      title: item.name || "Unknown Title",
      artist: item.artists?.primary?.map((a: any) => a.name).join(", ") || "Unknown Artist",
      thumbnails: {
        default: {
          url: item.image?.find((img: any) => img.quality === "500x500")?.url ||
               item.image?.[item.image.length - 1]?.url || // Fallback to highest available quality
               "https://placehold.co/120",
        },
      },
      videoId: item.downloadUrl?.find((url: any) => url.quality === "320kbps")?.url ||
               item.downloadUrl?.[item.downloadUrl.length - 1]?.url || // Fallback to highest quality
               item.url || "",
      source: "jiosaavn",
    }));
  } catch (error: any) {
    console.error("JioSaavn Fetch Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
}