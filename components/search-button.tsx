"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Link2Icon, LinkIcon, SearchIcon, MusicIcon } from "lucide-react"
import GradientButton from "./ui/hero-search-button"
import { useMotionValue, motion, useMotionTemplate } from "motion/react";

export default function SearchButton() {
    const router = useRouter()

    // Mouse position values for background gradient
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const radius = 100; // Change this to increase the radius of the hover effect
    const [visible, setVisible] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    
    // Initialize window width on client-side
    useEffect(() => {
        setWindowWidth(window.innerWidth);
        
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Text and icon cycling states - with both full and short variants
    const phrases = [
        { 
            text: "Drop a beat or paste your playlist...", 
            shortText: "Drop a beat...",
            icon: Link2Icon 
        },
        { 
            text: "Unearth musical gems hiding in plain sight...", 
            shortText: "Unearth musical gems...",
            icon: SearchIcon 
        },
        { 
            text: "Hunt for sonic treasures...", 
            shortText: "Hunt for music...",
            icon: SearchIcon 
        },
        { 
            text: "Paste a playlist link to import your vibe...", 
            shortText: "Paste a playlist...",
            icon: LinkIcon 
        },
        { 
            text: "What's your soundtrack today?", 
            shortText: "Your soundtrack?",
            icon: MusicIcon 
        },
        { 
            text: "Enter the portal to your next obsession...", 
            shortText: "Find your next obsession...",
            icon: Link2Icon 
        },
        { 
            text: "Find your next earworm...", 
            shortText: "Next earworm?",
            icon: SearchIcon 
        },
        { 
            text: "Summon your musical soulmates...", 
            shortText: "Musical soulmates...",
            icon: MusicIcon 
        },
        { 
            text: "Import playlists from the musical universe...", 
            shortText: "Import playlists...",
            icon: LinkIcon 
        },
        { 
            text: "What melody is calling your name?", 
            shortText: "Which melody?",
            icon: SearchIcon 
        }
    ];
    
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [text, setText] = useState("");
    const [cursorIndex, setCursorIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    
    // Typewriter effect with responsive text selection
    useEffect(() => {
        // Choose appropriate text length based on screen size
        const isSmallScreen = windowWidth < 640; // Adjust breakpoint as needed
        const currentPhrase = isSmallScreen 
            ? phrases[phraseIndex].shortText 
            : phrases[phraseIndex].text;
        
        // Typing animation
        if (isTyping) {
            if (cursorIndex < currentPhrase.length) {
                const timeout = setTimeout(() => {
                    setText(currentPhrase.substring(0, cursorIndex + 1));
                    setCursorIndex(cursorIndex + 1);
                }, 50);
                return () => clearTimeout(timeout);
            } else {
                // Finished typing current phrase, wait before deleting
                const timeout = setTimeout(() => {
                    setIsTyping(false);
                    setCursorIndex(currentPhrase.length);
                }, 2000);
                return () => clearTimeout(timeout);
            }
        } 
        // Deleting animation
        else {
            if (cursorIndex > 0) {
                const timeout = setTimeout(() => {
                    setText(currentPhrase.substring(0, cursorIndex - 1));
                    setCursorIndex(cursorIndex - 1);
                }, 30);
                return () => clearTimeout(timeout);
            } else {
                // Finished deleting, move to next phrase
                setIsTyping(true);
                setPhraseIndex((phraseIndex + 1) % phrases.length);
                const timeout = setTimeout(() => {
                    setCursorIndex(0);
                }, 500);
                return () => clearTimeout(timeout);
            }
        }
    }, [cursorIndex, isTyping, phraseIndex, phrases, windowWidth]);

    // Update mouse position on hover
    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    useEffect(() => {
        const handleKeyDown = (e:any) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                router.push("/search")
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [router])

    // Get current icon
    const IconComponent = phrases[phraseIndex].icon;

    return (
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
            className="h-full max-w-xl mx-2 w-full pointer-events-auto sm:mx-auto my-auto bg-background rounded-full flex items-center p-px flex-1"
        >
            <Link
                href="/search"
                className="h-full w-full max-w-3xl mx-auto my-auto rounded-full focus:border-ring focus:ring-cyan-400/60 cursor-text outline-none focus:ring-1"
            >
                <div className="h-full bg-slate-900 backdrop-blur-sm focus:border-ring focus:ring-ring/50 border border-cyan-600/20 rounded-full flex items-center p-2 flex-1"
                >
                    <span className="flex grow px-2 items-center gap-2">
                        <IconComponent
                            className="text-muted-foreground"
                            size={20}
                            aria-hidden="true"
                        />
                        <span className="text-accent-foreground font-semibold dark:text-zinc-500 truncate">
                            {text}
                        </span>
                        <div className="text-muted-foreground/80 pointer-events-none ml-auto hidden sm:flex items-center justify-center">
                            <kbd className="text-muted-foreground inline-flex font-[inherit] space-x-1 text-xs font-medium">
                                <span className="opacity-70 border border-cyan-400/50 px-2 rounded-sm bg-slate-950/80 text-base">⌘</span>
                                <span className="opacity-70 border border-cyan-400/50 px-2 rounded-sm bg-slate-950/80 text-base">K</span>
                            </kbd>
                        </div>
                    </span>
                    <GradientButton
                        className="bg-white text-black px-3 sm:px-6 py-3 rounded-full font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Search Button Content */}
                    </GradientButton>
                </div>
            </Link>
        </motion.div>
    )
}