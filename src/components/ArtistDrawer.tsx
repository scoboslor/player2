import React from 'react';
import { Drawer } from 'vaul';
import { useSpotify } from '../contexts/SpotifyContext';
import { useDrawer } from './DrawerManager';
import ContextMenuDemo from './ContextMenu';
import ColorThief from 'colorthief';
import { getTextColor } from './DynamicBackground';
import type { SpotifyTrack, SpotifyArtist } from '../types';

type SimplifiedArtist = {
  name: string;
  id: string;
};

export const parseArtists = (artists: (SpotifyArtist | SimplifiedArtist)[], nested: boolean = false) => {
  if (!artists || artists.length === 0) return '';
  return artists.map((artist, index) => (
    <span key={artist.id}>
      {artist.name}
      {index < artists.length - 1 && <span className={nested ? 'text-white/50' : 'text-black/50'}>, </span>}
    </span>
  ));
};

export function ArtistDrawer() {
  const { sdk } = useSpotify();
  const { openDrawer } = useDrawer();

  const openArtist = async (id: string, nested: boolean) => {
    const [artistResponse, topTracksResponse, albumsResponse] = await Promise.all([
      sdk?.artists.get(id),
      sdk?.artists.topTracks(id, "ES"),
      sdk?.artists.albums(id)
    ]);

    if (!artistResponse) return;

    let imageUrl = artistResponse.images[0].url;
    let name = artistResponse.name;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl || "";

    img.onload = async () => {
      const colorThief = new ColorThief();
      const dominantColor = colorThief.getColor(img);
      const textColor = getTextColor(dominantColor);

      const header = (
        <div 
          className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip`} 
          style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}
        >
          <img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
          <div className="blur-vignette"></div>
          <Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>
            {name}
          </Drawer.Title>
        </div>
      );

      const albums = albumsResponse?.items.filter(({ album_type }) => album_type === "album") || [];

      const content = (
        <div 
          className='flex flex-col flex-1 gap-3 px-2 py-5' 
          style={{ 
            color: `rgb(${textColor})`,  
            background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` 
          }}
        >
          <p>Tracks</p>
          {topTracksResponse?.tracks.map((track, i) => {
            const total = topTracksResponse.tracks.length;
            const blendPercentage = 100 - Math.floor((i / (total - 1)) * 100);

            return (
              <ContextMenuDemo
                key={track.id || i}
                track={track as SpotifyTrack}
                trigger={
                  <div className='flex gap-3'>
                    <img 
                      src={track.album.images[0].url} 
                      alt={track.name} 
                      className='size-10 rounded pointer-events-none' 
                    />
                    <div 
                      className='flex flex-col' 
                      style={{
                        color: `color-mix(in srgb, rgb(${textColor}) ${blendPercentage}%, white)`
                      }}
                    >
                      <span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
                      <span className='text-xs line-clamp-1'>{parseArtists(track.artists, true)}</span>
                    </div>
                  </div>
                }
              />
            );
          })}
          {albums.length > 0 && <p>Albums</p>}
          <div 
            className='grid gap-3 overflow-auto w-full [scrollbar-width:_none]' 
            style={{gridTemplateColumns: `repeat(${albums.length}, 96px)`}}
          >
            {albums.map((album, i) => (
              <div key={album.id || i} className='flex flex-col gap-1 items-stretch'>
                <img 
                  src={album.images[0].url} 
                  alt={album.name} 
                  className='size-24 aspect-square rounded pointer-events-none w-full' 
                />
                <div className='text-center'>
                  <span className='mix-blend-multiply_ line-clamp-1'>{album.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      openDrawer({
        title: "",
        header: header,
        content: content
      });
    };
  };

  return null; // This component doesn't render anything directly
} 