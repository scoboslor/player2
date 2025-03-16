import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LyricsContextType {
  lyricsVisible: boolean;
  setLyricsVisible: (visible: boolean) => void;
}

const LyricsContext = createContext<LyricsContextType | undefined>(undefined);

export function LyricsProvider({ children }: { children: ReactNode }) {
  const [lyricsVisible, setLyricsVisible] = useState(false);

  return (
    <LyricsContext.Provider value={{ lyricsVisible, setLyricsVisible }}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics(): LyricsContextType {
  const context = useContext(LyricsContext);
  if (context === undefined) {
    throw new Error('useLyrics must be used within a LyricsProvider');
  }
  return context;
} 