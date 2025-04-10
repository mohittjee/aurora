"use client"

import { useState, useEffect, useRef } from "react"
import SearchButton from "@/components/search-button"
import { motion } from 'framer-motion';
import { logos } from "@/constants";

export default function Home() {
  const [hoveredLogo, setHoveredLogo] = useState<string | null>(null);
  const [logoListWidth, setLogoListWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const logoListRef = useRef<HTMLUListElement>(null);

  // Calculate dimensions on mount and on window resize
  useEffect(() => {
    const updateWidths = () => {
      if (logoListRef.current) {
        setLogoListWidth(logoListRef.current.offsetWidth);
      }
    };

    updateWidths();
    window.addEventListener('resize', updateWidths);

    return () => {
      window.removeEventListener('resize', updateWidths);
    };
  }, []);

  // Double the logos to create seamless loop
  const extendedLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] pointer-events-none">
      <div className="max-w-3xl w-full flex flex-col items-center justify-center pointer-events-none">
        {/* Adding explicit centering for the search button */}
        <div className="flex-1 flex items-center justify-center w-full pt-10">
          <SearchButton />
        </div>

        <div className="fixed bottom-32 flex flex-col items-center gap-2 pointer-events-none">
          <div className="flex w-full items-center justify-center gap-2">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent to-cyan-400 rounded-full" />
            <div className="whitespace-nowrap font-semibold text-2xl flex items-center">
              Supported Platforms
            </div>
            <div className="w-full h-[1px] bg-gradient-to-l from-transparent to-cyan-400 rounded-full" />
          </div>

          <div
            ref={containerRef}
            className="w-sm p-1 overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
          >
            <motion.div
              animate={{
                x: [0, -logoListWidth / 2]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 25,
                  ease: "linear"
                }
              }}
              className="flex"
            >
              <ul ref={logoListRef} className="flex pointer-events-auto items-center justify-start [&_li]:mx-4 [&_img]:max-w-none flex-shrink-0">
                {extendedLogos.map((logo, index) => (
                  <li key={`${logo.id}-${index}`} className="flex items-center justify-center">
                    <img
                      src={hoveredLogo === `${logo.id}-${index}` ? logo.colored : logo.negative}
                      alt={logo.alt}
                      className="aspect-square h-10 transition-all duration-300 hover:scale-110"
                      onMouseEnter={() => setHoveredLogo(`${logo.id}-${index}`)}
                      onMouseLeave={() => setHoveredLogo(null)}
                    />
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}