import React, { useEffect, useState, useRef } from 'react';
import { SpotifyItem } from '../types';
import { motion, progress } from 'framer-motion';
import { useSpotify } from '../contexts/SpotifyContext';
import { useLyrics } from '../contexts/LyricsContext';
import { useDebounce } from '../hooks/useDebounce';
import { getArtists } from '../App';


const filters = [
    {
        name: 'All',
        value: 'all',
    },
    {
        name: 'Artists',
        value: 'artist',
    },
    {
        name: 'Albums',
        value: 'album',
    },
    {
        name: 'Songs',
        value: 'track',
    },
    {
        name: 'Playlists',
        value: 'playlist',
    },
];


export const Search = React.memo(function Search() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce delay
  const [searchResults, setSearchResults] = useState<SpotifyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sdk } = useSpotify();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Add event listener for ctrl+k or cmd+k
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        setIsOpen(true);
        containerRef.current?.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Exit if escape key is pressed
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSelectedFilter(filters[0]);
      }
    };
    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery) {
      let searchType = selectedFilter.value === "all" ? filters.slice(1).map((filter) => filter.value) : [selectedFilter.value];
      setIsLoading(true);
      
      sdk?.search(debouncedSearchQuery, searchType as any).then((results) => {
        const items = Object.values(results).flatMap((result) => result?.items || []).filter(Boolean) as SpotifyItem[];
        console.log(items, results);
        setSearchResults(items);
      }).catch(error => {
        setError(error.message);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, selectedFilter.value]);


  const addToQueue = (result: SpotifyItem) => {
    if (result.type === 'track') {
      sdk?.player.addItemToPlaybackQueue(result.uri);
    }
  }

  return (isOpen && <>
    <div onClick={() => setIsOpen(false)} className={`fixed inset-0 z-50 ${!isOpen ? 'hidden' : ''}`}></div>
        <div
        ref={containerRef}
        className={`modal overflow-y-auto overflow-x-hidden px-6 py-4 m-10 space-y-4 rounded-xl transition-all duration-300 ${!isOpen ? 'hidden' : 'fixed inset-0 z-50 bg-(--color) backdrop-blur-[300px] flex flex-col gap-1'}`}
        >
            <input type="search" placeholder='Search' className='w-full rounded-full bg-[#0000001a] px-4 py-2 text-lg text-white focus:outline-none' onChange={(e) => setSearchQuery(e.target.value)} />
            <div className='flex'>
                {filters.map((filter) => (
                    <button key={filter.value} className={`text-md px-4 py-1 rounded-full font-medium ${selectedFilter.value === filter.value ? 'bg-white text-black' : 'hover:text-[color-mix(in_srgb,_var(--text-color)_75%,_black)] text-[color-mix(in_srgb,_var(--color)_99%,_black)] hover:bg-[color-mix(in_srgb,_var(--color)_99%,_black)] transition-all duration-300'}`} onClick={() => setSelectedFilter(filter)}>
                        {filter.name}
                    </button>
                ))}
            </div>
            {isLoading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            <div className='overflow-y-auto overflow-x-hidden flex flex-col gap-2'>
                {searchResults.map((result) => (
                    <button key={result.id} onClick={() => addToQueue(result)} className='flex items-center gap-2 text-start py-1 px-2 rounded transition-colors duration-300 hover:bg-[color-mix(in_srgb,_var(--color)_99%,_black)]'>
                        {result.type === 'track' ? (
                            <div key={result.id} className='flex items-center gap-2'>
                            <img src={result.album.images[0]?.url} alt={result.name} className='w-10 h-10 rounded-sm pointer-events-none' />
                            <div>
                                <p>{result.name}</p>
                                <p>{getArtists(result.artists)}</p>
                            </div>
                        </div>
                    )
                    : 
                    result.type === 'artist' ? (
                        <div key={result.id} className='flex items-center gap-2'>
                            <img src={result.images?.[0]?.url} alt={result.name} className='w-10 h-10 rounded-sm pointer-events-none' />
                            <p>{result.name}</p>
                        </div>
                    )
                    :
                    result.type === 'album' ? (
                        <div key={result.id} className='flex items-center gap-2'>
                            <img src={result.images[0]?.url} alt={result.name} className='w-10 h-10 rounded-sm pointer-events-none' />
                            <p>{result.name}</p>
                        </div>
                    )
                    :
                    (
                        <div key={result.id} className='flex items-center gap-2'>
                            <img src={result.images[0]?.url} alt={result.name} className='w-10 h-10 rounded-sm pointer-events-none' />
                            <p>{result.name}</p>
                        </div>
                    )
                    }
                    </button>
                ))}
            </div>
        </div>
    </>
  );
});
