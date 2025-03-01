"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input"; // Assuming shadcn/ui
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { Loader2 } from "lucide-react";
import { useAudioStore } from "@/store/audioStore";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState<string>("");
  const { loading } = useAudioStore();

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <div className="flex gap-2 p-4 max-w-3xl mx-auto">
      <Input
        placeholder="Search song or paste playlist URL..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
        disabled={loading}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />
      <Button
        onClick={handleSearch}
        disabled={loading}
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </div>
  );
}