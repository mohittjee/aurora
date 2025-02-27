"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAudioStore } from "@/store/audioStore";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState<string>("");
  const { loading } = useAudioStore();

  const handleSearch = () => {
    if (query) {
      onSearch(query);
      setQuery("");
    }
  };

  return (
    <div className="flex gap-2 p-4">
      <Input
        placeholder="Search song or paste playlist URL..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
        disabled={loading}
      />
      <Button onClick={handleSearch} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </div>
  );
}