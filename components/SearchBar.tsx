"use client";

import { useState, forwardRef, useEffect } from "react";
import { Loader2, Link } from "lucide-react";
import { useAudioStore } from "@/store/audioStore";
import { useUser } from "@clerk/nextjs";
import { UploadDialog } from "@/components/ui/upload-dialog";
import { AuthDialog } from "@/components/ui/auth-dialog";
import GradientButton from "./ui/hero-search-button";
import { useMotionValue, motion, useMotionTemplate } from "motion/react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onUploadComplete?: () => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onSearch, onFocus, onUploadComplete }, ref) => {
    const [query, setQuery] = useState<string>("");
    const { loading } = useAudioStore();
    const { isSignedIn } = useUser();
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    // Mouse position values for background gradient
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const radius = 100; // Change this to increase the radius of the hover effect
    const [visible, setVisible] = useState(false);

    // Update mouse position on hover
    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      let { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    // Handle search
    const handleSearch = () => {
      if (query.trim()) {
        onSearch(query.trim());
        setQuery("");
      }
    };

    // Handle upload click
    const handleUploadClick = () => {
      if (!isSignedIn) {
        setShowAuthDialog(true);
      } else {
        setShowUploadDialog(true);
      }
    };

    // Handle upload complete
    const handleUploadComplete = () => {
      setShowUploadDialog(false);
      if (onUploadComplete) {
        onUploadComplete();
      }
    };

    // Add keyboard shortcut for search focus
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          if (ref && "current" in ref && ref.current) {
            ref.current.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [ref]);

    return (
      <>
        <div className="max-w-3xl mx-auto my-auto flex items-center gap-4">
          {/* <h1 className="text-4xl font-bold text-white mb-4">Discover Your Next Favorite Song</h1> */}

          <motion.div
            style={{
              background: useMotionTemplate`
                radial-gradient(
                  ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
                  #22d3ee,
                  transparent 80%
                )
              `,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            className="h-full bg-background rounded-full flex items-center p-px flex-1"
          >
            <div className="h-full bg-slate-900 backdrop-blur-sm focus:border-ring focus:ring-ring/50 border border-cyan-600/20 rounded-full flex items-center p-2 flex-1"
            >
              <div className="h-full flex items-center flex-1 px-4 py-2">
                <Link className="w-6 h-6 text-gray-400 mr-2" />
                <input
                  type="text"
                  className="bg-transparent flex-1 outline-none"
                  placeholder="Search song or paste playlist URL... (Ctrl+K)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  ref={ref}
                  onFocus={onFocus}
                />
              </div>
              <GradientButton
                className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search songs"}
              </GradientButton>
            </div>
          </motion.div>

          <span>or</span>

          <button
            className="bg-transparent border border-gray-700 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-900 transition whitespace-nowrap"
            onClick={handleUploadClick}
          >
            Upload Songs
          </button>
        </div>

        {/* Upload Dialog */}
        <UploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUploadComplete={handleUploadComplete}
        />

        {/* Auth Dialog */}
        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          title="Authentication Required"
          description="You need to be logged in to upload songs. Would you like to sign in now?"
          actionType="upload"
          onComplete={() => {
            setShowAuthDialog(false);
            if (isSignedIn) {
              setShowUploadDialog(true);
            }
          }}
        />
      </>
    );
  }
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
