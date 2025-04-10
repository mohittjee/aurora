"use client"

import { TooltipComp } from "@/components/Tooltip";
import { Share2Icon } from "lucide-react";

const Footer = () => {
  const handleShareOnTwitter = () => {
    const text = "Check out this awesome music player app: Mellow 🐰";
    const url = "https://mellow-music.vercel.app";
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterShareUrl, "_blank");
  };

  return (
    <footer className="pointer-events-auto px-4 py-3.5 bg-gradient-to-r from-slate-950 to-slate-800 border-t border-slate-700">
      <div className="max-w-6xl mx-auto flex flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            MELL🐰W
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {/* {logos.slice(0, 5).map((logo) => (
            <img
              key={logo.id}
              src={logo.negative}
              alt={logo.alt}
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          ))} */}
        </div>

        <div className="text-sm text-slate-400 flex flex-nowrap items-center">
          <TooltipComp tooltipText="Code curious? Collab? 👀">
            <a 
              href="https://github.com/mohittjee/mellow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-3"
            >
              <img
                src='./social-icons/GithubNegative.svg'
                alt='github'
                className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </TooltipComp>
          
          <div className="h-4 border-l border-cyan-600"></div>
          
          <TooltipComp tooltipText="Say hi! 👋">
            <a 
              href="https://x.com/OffSenseTweets" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center px-3"
            >
              <img
                src='./social-icons/XNegative.svg'
                alt='Twitter'
                className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
          </TooltipComp>
          
          <div className="h-4 border-l border-cyan-600"></div>
          
          <TooltipComp tooltipText="Spread the vibes 🎵">
            <button 
              onClick={handleShareOnTwitter}
              className="flex items-center bg-transparent border-none px-3 cursor-pointer"
            >
              {/* <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-6 w-auto text-slate-400 opacity-70 hover:opacity-100 transition-opacity"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg> */}
              <Share2Icon className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"/>
            </button>
          </TooltipComp>
        </div>
      </div>
    </footer>
  );
};

export default Footer;