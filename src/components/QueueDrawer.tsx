import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useSpotify } from '../contexts/SpotifyContext';
import { useDrawer } from './DrawerManager';
import ContextMenuDemo from './ContextMenu';
import ColorThief from 'colorthief';
import { getTextColor } from './DynamicBackground';
import type { SpotifyTrack, SpotifyArtist } from '../types';
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { openArtist } from '../App';

function parseArtists(artists: SpotifyArtist[], sdk: SpotifyApi, openDrawer: Function) {
  return artists.map((artist, index) => (
    <span 
      key={artist.id} 
      onClick={() => openArtist(artist.id, sdk, openDrawer)} 
      data-id={artist.id} 
      className={`${(index < artists.length - 1) ? `after:content-[",_"]`: ``}`}
    >
      <span className='hover:underline'>{artist.name}</span>
    </span>
  ));
}

export function QueueDrawer() {
  const { sdk, queue } = useSpotify();
  const [items, setItems] = useState(queue);

  useEffect(() => {
    setItems(queue);
  }, [queue]);

  if (!sdk) return null;

  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems} className={"flex flex-col gap-3 p-3 bg-black/40 text-white flex-1"}>
      <AnimatePresence>
        {items.map((item, i) => (
          <Item key={item.id} track={item} index={i} />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

function Item({ track, index }: { track: SpotifyTrack; index: number}) {
  const { sdk } = useSpotify();
  const { openDrawer } = useDrawer();
  // const controls = useDragControls();
  
  if (!sdk) return null;

  return (
    <Reorder.Item
      value={track}
      // dragListener={false}
      // dragControls={controls}
      initial={{ opacity: 0, translateY: 10, transition: { delay: index * 0.5 } }}
      animate={{ opacity: 1, translateY: 0, transition: { delay: 0 } }}
      exit={{ opacity: 0, height: 0 }}
    >
      <ContextMenuDemo
        track={track}
        trigger={
          <div className='flex gap-3'>
            <img 
              src={track.album.images[0].url} 
              alt={track.name} 
              className='size-10 rounded pointer-events-none' 
            />
            <div className='flex flex-col flex-1'>
              <span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
              <span className='text-xs line-clamp-1 break-all'>{parseArtists(track.artists, sdk, openDrawer)}</span>
            </div>
            <button 
              type='button' 
              // onPointerDown={(e) => controls.start(e)}
              className="p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#e3e3e3">
                <path d="M360-160q-33 0-56.5-23.5T280-240t23.5-56.5T360-320t56.5 23.5T440-240t-23.5 56.5T360-160m240 0q-33 0-56.5-23.5T520-240t23.5-56.5T600-320t56.5 23.5T680-240t-23.5 56.5T600-160M360-400q-33 0-56.5-23.5T280-480t23.5-56.5T360-560t56.5 23.5T440-480t-23.5 56.5T360-400m240 0q-33 0-56.5-23.5T520-480t23.5-56.5T600-560t56.5 23.5T680-480t-23.5 56.5T600-400M360-640q-33 0-56.5-23.5T280-720t23.5-56.5T360-800t56.5 23.5T440-720t-23.5 56.5T360-640m240 0q-33 0-56.5-23.5T520-720t23.5-56.5T600-800t56.5 23.5T680-720t-23.5 56.5T600-640"/>
              </svg>
            </button>
          </div>
        }
      />
    </Reorder.Item>
  );
}
