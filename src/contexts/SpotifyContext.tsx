import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { LyricsResponse, SpotifyTrack } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ['user-read-playback-state', 'user-modify-playback-state', 'user-library-read'];

// Move cache outside or use useRef to persist across renders
const lyricsCache = new Map<string, LyricsResponse>();

interface SpotifyContextType {
  sdk: SpotifyApi | null;
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  error: string | null;
  queue: SpotifyTrack[];
  lyrics: LyricsResponse | null;
  togglePlayback: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | null>(null);

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [sdk, setSdk] = useState<SpotifyApi | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<SpotifyTrack[]>([]);
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null);

  const lastPrefetchedId = useRef<string | null>(null);
  const activeAbortController = useRef<AbortController | null>(null);


  // Initialize SDK
  useEffect(() => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      setError("Missing Spotify Credentials");
      return;
    }
    const spotify = SpotifyApi.withUserAuthorization(CLIENT_ID, REDIRECT_URI, SCOPES);
    setSdk(spotify);
    // Cleanup on unmount: cancel any pending fetches
    return () => activeAbortController.current?.abort();
  }, []);

  /**
   * Parses LRC format into a structured LyricsResponse
   */
  const parseLrcLyrics = useCallback((lrcString: string): LyricsResponse => {
    const lines = lrcString.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    const parsedLines: any[] = [];

    lines.forEach((line, i) => {
      const match = line.match(timeRegex);
      if (!match) return;

      const [fullTag, min, sec, ms] = match;
      const words = line.replace(fullTag, '').trim();
      const startTimeMs = (parseInt(min) * 60000 + parseInt(sec) * 1000 + parseInt(ms.padEnd(3, '0'))).toString();

      parsedLines.push({
        words: words || "♪",
        startTimeMs,
        endTimeMs: "0", // Calculated in next pass
        timeTag: fullTag.replace('[', '').replace(']', '')
      });
    });

    // Calculate end times based on the next line's start time
    const linesWithEndTimes = parsedLines.map((line, i) => ({
      ...line,
      endTimeMs: parsedLines[i + 1]?.startTimeMs || (parseInt(line.startTimeMs) + 5000).toString()
    }));

    return { error: false, syncType: 'LINE_SYNCED', lines: linesWithEndTimes };
  }, []);

  /**
   * Fetches lyrics from LRCLIB with caching
   */
  const fetchLyrics = useCallback(async (track: SpotifyTrack, updateGlobalState = false, signal?: AbortSignal) => {
    const cacheKey = `${track.artists[0].name}-${track.name}`;
    
    if (lyricsCache.has(cacheKey)) {
      const cached = lyricsCache.get(cacheKey)!;
      if (updateGlobalState) setLyrics(cached);
      return cached;
    }

    try {
      const query = new URLSearchParams({
        artist_name: track.artists[0].name,
        track_name: track.name,
        duration: (track.duration_ms / 1000).toString()
      });

      // Pass the signal to the fetch call
      const res = await fetch(`https://lrclib.net/api/get?${query}`, { signal });
      
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (!data.syncedLyrics) return null;

      const syncedLyrics = data.syncedLyrics.startsWith("[00:00") 
        ? data.syncedLyrics 
        : `[00:00.00]\n${data.syncedLyrics}`;

      const parsed = parseLrcLyrics(syncedLyrics);
      lyricsCache.set(cacheKey, parsed);
      
      if (updateGlobalState) {
        setLyrics(parsed);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return parsed;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`Fetch aborted for: ${track.name}`);
      } else {
        if (updateGlobalState) setLyrics(null);
      }
      return null;
    }
  }, [parseLrcLyrics]);

  const refreshQueue = useCallback(async () => {
    if (!sdk) return;
    try {
      const queueData = await sdk.player.getUsersQueue();
      setQueue(queueData.queue.filter(t => t.type === 'track') as SpotifyTrack[]);
    } catch (err) {
      console.error('Queue error:', err);
    }
  }, [sdk]);

  // Main Playback Polling
  useEffect(() => {
    if (!sdk) return;

    const poll = async () => {
      try {
        const state = await sdk.player.getCurrentlyPlayingTrack();
        if (!state || !state.item) return;
    
        const track = state.item as SpotifyTrack;
        setIsPlaying(state.is_playing);
        setProgress(state.progress_ms);
    
        // Track changed logic
        if (track.id !== currentTrack?.id) {
          // 1. Cancel the previous fetch immediately
          if (activeAbortController.current) {
            activeAbortController.current.abort();
          }

          // 2. Create a new controller for the new track
          const controller = new AbortController();
          activeAbortController.current = controller;

          setCurrentTrack(track);
          setDuration(track.duration_ms);
          lastPrefetchedId.current = null; // Reset prefetch tracker

          // 3. Fetch lyrics with the signal
          fetchLyrics(track, true, controller.signal);
          refreshQueue();
        }
    
        // IMPROVED PRE-FETCH LOGIC:
        const remaining = track.duration_ms - state.progress_ms;
        
        // Only trigger if:
        // 1. Less than 10s remaining
        // 2. There is a next song in queue
        // 3. We haven't already prefetched for THIS specific current track session
        if (remaining < 10000 && queue.length > 0 && lastPrefetchedId.current !== track.id) {
          console.log("Prefetching next song lyrics...");
          
          // Mark this track ID as "prefetch triggered" so it doesn't run again next second
          lastPrefetchedId.current = track.id; 
          
          fetchLyrics(queue[0], false); 
        }
    
      } catch (err) {
        console.warn('Playback poll error:', err);
      }
    };

    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [sdk, currentTrack, queue, fetchLyrics, refreshQueue]);

  const togglePlayback = async () => {
    if (!sdk) return;
    try {
      if (isPlaying) {
        await sdk.player.pausePlayback();
        setIsPlaying(false);
      } else {
        await sdk.player.startResumePlayback();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Toggle playback failed', err);
    }
  };

  const value = {
    sdk,
    currentTrack,
    isPlaying,
    progress,
    duration,
    error,
    queue,
    lyrics,
    togglePlayback,
    refreshQueue,
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify must be used within a SpotifyProvider');
  return context;
};