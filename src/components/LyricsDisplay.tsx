import React, { useEffect, useState, useRef } from 'react';
import { LyricsLine, SpotifyTrack } from '../types';
import { motion } from 'framer-motion';
import { useSpotify } from '../contexts/SpotifyContext';
import { useLyrics } from '../contexts/LyricsContext';

interface Props {
  lines: LyricsLine[];
  progress: number;
  isPlaying: boolean;
  track: SpotifyTrack;
}

export const LyricsDisplayLyrics = React.memo(function LyricsDisplayLyrics() {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lyricsStyles, setLyricsStyles] = useState<String | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const { lyrics, isPlaying, progress, currentTrack } = useSpotify();
  const { lyricsVisible, setLyricsVisible } = useLyrics();
  let lines = lyrics?.lines;
  
  useEffect(() => {
    if (!currentTrack) {
      setLyricsStyles(null);
      return;
    }
    
    const isCharliXCX = currentTrack.artists.some(artist => 
      artist.name.toLowerCase() === "charli xcx"
    );
    
    const isTaylorSwift = currentTrack.artists.some(artist => 
      artist.name.toLowerCase() === "taylor swift"
    );
    
    const isTender = currentTrack.artists.some(artist => 
      artist.name.toLowerCase() === "tender"
    );
    
    const albumName = currentTrack.album.name.toLowerCase();
    
    const isBrat = albumName === "brat" || 
                   albumName === "brat and it's completely different but also still brat" ||
                   albumName === "brat and it’s completely different but also still brat";
    
    const isFolklore = albumName === "folklore" || 
                       albumName === "folklore: the long pond studio sessions" ||
                       albumName === "evermore";
    
    const is6AM = albumName === "6 in the morning";

    if (isCharliXCX && isBrat) {
      setLyricsStyles("brat");
    } else if (isTaylorSwift && isFolklore) {
      setLyricsStyles("folklore");
    } else if (isTender && is6AM) {
      setLyricsStyles("6 in the morning");
    } else {
      setLyricsStyles(null);
    }
    
  }, [currentTrack]);

  useEffect(() => {
    if (!lines) {
      // setLyricsVisible(false);
      return;
    }

    const getCurrentLineIndex = () => {
      const currentTime = progress / 1000; // Convert to seconds
      let index = lines.findIndex((line, i) => {
        const currentTimeTag = timeTagToSeconds(line.timeTag);
        const nextTimeTag = lines[i + 1] 
          ? timeTagToSeconds(lines[i + 1].timeTag)
          : Infinity;
        return currentTime >= currentTimeTag && currentTime < nextTimeTag;
      });
      return index;
    };

    setCurrentLineIndex(getCurrentLineIndex());
  }, [progress, lines]);

  useEffect(() => {
    // containerRef?.current?.scrollTo(0, 0);
    if (containerRef.current && currentLineIndex >= 0 && lyricsVisible) {
      const lineElement = containerRef.current.children[currentLineIndex] as HTMLElement;
      if (lineElement) {
        // Mark as programmatic scroll
        isProgrammaticScrollRef.current = true;
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Reset flag after scroll animation completes (smooth scroll typically takes ~500ms)
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);
      }
    }
  }, [currentLineIndex]);

  useEffect(() => {
    setCurrentLineIndex(0);
  }, [currentTrack]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Only remove "test" attribute if it's user-initiated scrolling
      if (!isProgrammaticScrollRef.current) {
        // Remove "test" attribute when scrolling
        container.removeAttribute('test');

        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Add "test" attribute after scrolling stops (300ms delay)
        scrollTimeoutRef.current = setTimeout(() => {
          container.setAttribute('test', '');
        }, 300);
      }
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const timeTagToSeconds = (timeTag: string): number => {
    const [minutes, seconds] = timeTag.split(':');
    return parseInt(minutes) * 60 + parseFloat(seconds);
  };


  return (
    <div
      key={`lyrics-${currentTrack?.id}`}
      ref={containerRef}
      className={`h-full overflow-y-auto overflow-x-hidden mb-24 px-6 py-4 space-y-4 text-[var(--text-color)] ${!lyricsVisible ? 'hidden' : ''}`}
      data-style={`${lyricsStyles ? lyricsStyles : ""}`}
      style={{ "--active-index": currentLineIndex }}
    >
      {lines && lines.map((line, index) => (
        <div
          key={index}
          className={`transition-all duration-300 delay-200 text-center tracking-wide ${
            index === currentLineIndex
              ? 'text-2xl font-bold text-[color-mix(in_srgb,_var(--color),_white)]? text-white transform scale-105'
              : 'text-lg font-medium'
          }`}
          data-text={line.words}
        >
          {line.words}
        </div>
      ))}
    </div>
  );
});

const LyricsDisplayButton = React.memo(function LyricsDisplayButton() {
  const { lyricsVisible, setLyricsVisible } = useLyrics();
  const { lyrics } = useSpotify();

  const handleClick = () => {
    if (document.startViewTransition) { 
      document.startViewTransition(() => {
        setLyricsVisible(!lyricsVisible);
      });
    } else {
      setLyricsVisible(!lyricsVisible);
    }
  }

  useEffect(() => {
    const handleKeyDown = ({ key }) => {
      if (key.toLowerCase() === "l") {
        handleClick();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  

  const hasLyrics = lyrics?.lines && lyrics.lines.length > 0;

  return (
    <button 
      disabled={!hasLyrics} 
      type='button' 
      onClick={handleClick} 
      className={`${hasLyrics ? "pointer-events-auto" : "opacity-50"} p-3 rounded-full hover:bg-[var(--color)] active:bg-[color-mix(in_srgb,_var(--color),_black_5%)] text-white opacity-60 transition-all active:scale-95 duration-300 [view-transition-name:lyrics-button] focus:outline-none`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12"></path><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5"></path><circle cx="16" cy="7" r="5"></circle></svg>
    </button>
  );
});

export const LyricsDisplay = {
  Button: LyricsDisplayButton,
  Lyrics: LyricsDisplayLyrics,
}