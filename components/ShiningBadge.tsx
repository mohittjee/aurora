"use client"

import { useState, useEffect } from "react";

interface ShiningBetaBadgeProps {
  text?: string;
  className?: string;
}

export default function ShiningBetaBadge({ 
  text = "BETA", 
  className = ""
}: ShiningBetaBadgeProps) {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 20);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative r-0 -top-2 bg-blue-700/70 text-[.5rem] font-semibold px-1 rounded-full border border-blue-400 overflow-hidden ${className}`}>
      {/* Shine effect */}
      <div 
        className="absolute h-4 w-0.5 blur-[2px] bg-white transform -skew-x-12" 
        style={{ left: `${position}%`, transition: 'left 0.05s ease' }}
      />
      <span className="text-blue-100">
        {text}
      </span>
    </div>
  );
}