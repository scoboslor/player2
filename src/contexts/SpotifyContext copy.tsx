import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { LyricsResponse, SpotifyTrack } from '../types';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ['user-read-playback-state', 'user-modify-playback-state', 'user-library-read'];

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
  refreshQueue: () => Promise<SpotifyTrack[] | undefined>;
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

  const cache = new Map<string, LyricsResponse>();
window.cacheMap = cache;
  useEffect(() => {
    const initializeSpotify = async () => {
      try {
        const spotify = SpotifyApi.withUserAuthorization(
          CLIENT_ID,
          REDIRECT_URI,
          SCOPES
        );
        setSdk(spotify);
      } catch (err) {
        setError('Failed to initialize Spotify SDK');
        console.error(err);
      }
    };

    initializeSpotify();
  }, []);

  const refreshQueue = useCallback(async () => {
    if (!sdk) return;
    try {
      const queueData = await sdk.player.getUsersQueue();
      let data = queueData.queue.filter(track => track.type === 'track') as SpotifyTrack[];
      setQueue(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  }, [sdk]);

  useEffect(() => {
    if (!sdk) return;

    const pollPlayback = async () => {
      try {
        const playbackState = await sdk.player.getCurrentlyPlayingTrack();
        if (!playbackState) return;

        const track = playbackState.item as SpotifyTrack;
        setIsPlaying(playbackState.is_playing);
        setProgress(playbackState.progress_ms);
        
        if (track?.id !== currentTrack?.id) {
          setCurrentTrack(track);
          setDuration(playbackState.item.duration_ms);
          await getSong(track);
          await refreshQueue();
        }

      } catch (err) {
        console.error('Failed to fetch playback state:', err);
      }
    };

    const interval = setInterval(pollPlayback, 1000);
    return () => clearInterval(interval);
  }, [sdk, currentTrack, refreshQueue]);

  // Load queue on initial mount when SDK is ready
  useEffect(() => {
    if (!sdk) return;
    
    const loadInitialQueue = async () => {
      await refreshQueue();
    };
    
    loadInitialQueue();
  }, [sdk, refreshQueue]);

  // Check if song is almost finished and preload next song
  useEffect(() => {
    if (!sdk || queue.length === 0) return;

    // Prefetch for next-in-queue change
    let didCancel = false;
    const prefetchNext = async () => {
      try {
        // Always prefetch the next song in the queue when queue changes
        if (queue[0]) {
          await fetchSong(queue[0]);
        }
      } catch (err) {
        if (!didCancel) {
          console.error('Failed to prefetch next track on queue change:', err);
        }
      }
    };
    prefetchNext();

    // Also check and preload if song is almost finished
    const checkAndPreload = async () => {
      try {
        if (!sdk || !currentTrack) return;
        const playbackState = await sdk.player.getCurrentlyPlayingTrack();
        if (!playbackState) return;
        const isAlmostFinished = playbackState.progress_ms >= playbackState.item.duration_ms - 5000;
        if (isAlmostFinished && queue[0]) {
          await fetchSong(queue[0]);
        }
      } catch (err) {
        if (!didCancel) {
          console.error('Failed to check playback state:', err);
        }
      }
    };

    const interval = setInterval(checkAndPreload, 1000);
    return () => {
      didCancel = true;
      clearInterval(interval);
    };
  }, [sdk, currentTrack, queue]);

  const togglePlayback = async () => {
    if (!sdk) return;
    // try {
    //   if (isPlaying) {
    //     await sdk.player.pausePlayback();
    //   } else {
    //     await sdk.player.startResumePlayback();
    //   }
    // } catch (err) {
    //   console.error('Failed to toggle playback:', err);
    // }
  };

  const getLyrics = async (track: SpotifyTrack) => {
    if (!track) return;
    const response = await fetch(
      `https://spotify-lyrics-api-pi.vercel.app/?trackid=${track?.id}&format=lrc`
    );
    const lyricsData = await response.json();
    // setLyrics(lyricsData);
    // console.log(lyricsData);
    scrollTo(0, 0);
  };

  const getSong = async (track: SpotifyTrack) => {
    const queryParams = new URLSearchParams({
      artist_name: track.artists[0].name,
      track_name: track.name
    });

    console.log(cache);
    

    const cacheKey = `${track.artists[0].name}-${track.name}`;
    const cachedLyrics = cache.get(cacheKey);
    if (cachedLyrics) {
      setLyrics(cachedLyrics);
      return cachedLyrics;
    }

    cache.set(cacheKey, {} as LyricsResponse);

    const searchResults = await fetch(`https://lrclib.net/api/get?${queryParams}`);
    const data = await searchResults.json();
    if (data.statusCode === 404) {
      setLyrics(null);
      return;
    }
    console.log(data);

    if (data.syncedLyrics) 
      data.syncedLyrics = data.syncedLyrics.startsWith("[00:00.00]") ? data.syncedLyrics : "[00:00.00]\n" + data.syncedLyrics;

    cache.set(cacheKey, data);
    
    const lyricsResponse = parseLrcLyrics(data.syncedLyrics);
    setLyrics(lyricsResponse);
    console.log(lyricsResponse);
    return data;
  };
  
  const fetchSong = async (track: SpotifyTrack) => {
    const queryParams = new URLSearchParams({
      artist_name: track.artists[0].name,
      track_name: track.name
    });

    const cacheKey = `${track.artists[0].name}-${track.name}`;
    const cachedLyrics = cache.get(cacheKey);
    if (cachedLyrics) {
      return cachedLyrics;
    }
    
    const searchResults = await fetch(`https://lrclib.net/api/get?${queryParams}`);
    const data = await searchResults.json();
    if (data.statusCode === 404) {
      return null;
    }

    data.syncedLyrics = data.syncedLyrics.startsWith("[00:00.00]") ? data.syncedLyrics : "[00:00.00]\n" + data.syncedLyrics;

    cache.set(cacheKey, data);
  
    return data;
  };
  

  const parseLrcLyrics = (lrcString: string): LyricsResponse => {
    // Initialize response object
    const response: LyricsResponse = {
      error: false,
      syncType: 'LINE_SYNCED',
      lines: []
    };

    // Split the LRC string into lines
    const lines = lrcString.split('\n');
    
    // Regular expression to match timestamp format [mm:ss.xx]
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = Array.from(line.matchAll(timeRegex));

      if (matches.length > 0) {
        // Get the lyrics text by removing all timestamps
        const words = line.replace(timeRegex, '').trim();
        
        // Convert timestamp to milliseconds for the current line
        const timestamp = matches[0]; // Use the first timestamp if multiple exist
        // remove the square brackets
        const timeTag = timestamp[0].replace('[', '').replace(']', ''); 
        
        const [_, minutes, seconds, milliseconds] = timestamp[0].match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/) || [];
        
        const startTimeMs = (
          parseInt(minutes) * 60 * 1000 +
          parseInt(seconds) * 1000 +
          parseInt(milliseconds.padEnd(3, '0'))
        ).toString();
        
        // Calculate endTimeMs using next line's timestamp if available
        let endTimeMs = '';
        if (i < lines.length - 1) {
          const nextLineMatches = lines[i + 1].match(timeRegex);
          if (nextLineMatches) {
            const [nextMinutes, nextSeconds, nextMilliseconds] = nextLineMatches[0].match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/)?.slice(1) || [];
            endTimeMs = (
              parseInt(nextMinutes) * 60 * 1000 +
              parseInt(nextSeconds) * 1000 +
              parseInt(nextMilliseconds.padEnd(3, '0'))
            ).toString();
          }
        }
        
        // Only add lines that have actual text content
        // if (words) {
          response.lines.push({
            words: words || " " || "♪",
            startTimeMs,
            endTimeMs,
            timeTag
          });
        // }
      }
    }
    console.log(response);
    return response;
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

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
} 