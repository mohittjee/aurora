"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAudioStore } from "@/store/audioStore";
import UploadForm from "@/components/UploadForm";
import axios from "axios";
import Image from "next/image";

export default function Dashboard() {
  const { data: session } = useSession();
  const { setSearchResults } = useAudioStore();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [uploadedSongs, setUploadedSongs] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
      fetchRecommendations();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const [playlistsRes, likesRes, uploadsRes] = await Promise.all([
        axios.get("/api/playlists"),
        axios.get("/api/likes"),
        axios.get("/api/uploads"),
      ]);
      setPlaylists(playlistsRes.data || []);
      setLikedSongs(likesRes.data || []);
      setUploadedSongs(uploadsRes.data || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get("/api/ai/recommendations");
      setRecommendations(res.data.recommendations || []);
      setSearchResults(res.data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome, {session?.user?.name || "User"}!</h1>
      <UploadForm onUpload={fetchUserData} />
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <div key={playlist.id} className="p-4 bg-white rounded shadow hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium">{playlist.name}</h3>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No playlists saved yet.</p>
          )}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Liked Songs</h2>
        <div className="space-y-2">
          {likedSongs.length > 0 ? (
            likedSongs.map((song) => (
              <div key={song.id} className="p-2 bg-white rounded shadow flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Image src={song.thumbnail || "https://via.placeholder.com/120"} alt={song.title} width={48} height={48} className="rounded" />
                <div>
                  <p className="text-sm font-medium">{song.title}</p>
                  <p className="text-xs text-gray-600">{song.artist}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No liked songs yet.</p>
          )}
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Uploaded Songs</h2>
        <div className="space-y-2">
          {uploadedSongs.length > 0 ? (
            uploadedSongs.map((song) => (
              <div key={song.id} className="p-2 bg-white rounded shadow flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Image src={song.thumbnail || "https://via.placeholder.com/120"} alt={song.title} width={48} height={48} className="rounded" />
                <div>
                  <p className="text-sm font-medium">{song.title}</p>
                  <p className="text-xs text-gray-600">{song.artist}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No uploaded songs yet.</p>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recommended Songs</h2>
        <div className="space-y-2">
          {recommendations.length > 0 ? (
            recommendations.map((song, index) => (
              <div key={index} className="p-2 bg-white rounded shadow flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Image src={song.snippet.thumbnails.default.url} alt={song.snippet.title} width={48} height={48} className="rounded" />
                <div>
                  <p className="text-sm font-medium">{song.snippet.title}</p>
                  <p className="text-xs text-gray-600">{song.snippet.artist}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recommendations yet. Like some songs to get started!</p>
          )}
        </div>
      </section>
    </div>
  );
}