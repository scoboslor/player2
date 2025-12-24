import React, { useState, memo, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Toaster } from 'sonner'
import { Music2 } from 'lucide-react';
import { LyricsDisplay } from './components/LyricsDisplay';
import { DynamicBackgroundTEST, getTextColor } from './components/DynamicBackground.tsx';
import { Search } from './components/Search';
import type { SpotifyTrack } from './types';
import ColorThief from 'colorthief';
import { SpotifyProvider, useSpotify } from './contexts/SpotifyContext';
import { LyricsProvider, useLyrics } from './contexts/LyricsContext';
import { LinearBlur } from './utils.tsx';
import { Drawer } from 'vaul';
import ContextMenuDemo from './components/ContextMenu.tsx';
import { DrawerProvider, useDrawer, DrawerData } from './components/DrawerManager';
import { Page, SavedTrack, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { motion, Reorder } from 'framer-motion';
import { QueueDrawer } from './components/QueueDrawer.tsx';

// Update the artist type to include id
type Artist = {
	name: string;
	id: string;
};

function AppContent() {
	const { currentTrack, error, isPlaying, sdk, queue } = useSpotify();
	const [color, setColor] = useState<[number, number, number] | null>(null);
	const [prevTrack, setPrevTrack] = useState<SpotifyTrack | null>(null);
	const previousTrackRef = React.useRef<SpotifyTrack | null>(currentTrack);

	// Effect for tracking previous track
	React.useEffect(() => {
		if (currentTrack && currentTrack.id !== previousTrackRef.current?.id) {
			setPrevTrack(previousTrackRef.current);
			previousTrackRef.current = currentTrack;
			document.title = `${currentTrack.name} - ${getArtists(currentTrack.artists)}`;
		}
	}, [currentTrack?.id]);

	// Effect for handling color when track changes
	React.useEffect(() => {
		if (!currentTrack) return;

		// Handle album art color
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = currentTrack?.album?.images[0]?.url || '';

		img.onload = async () => {
			const colorThief = new ColorThief();
			const dominantColor = colorThief.getColor(img);

			setColor(dominantColor);
			document.documentElement.style.setProperty('--color', `rgb(${dominantColor.toString()})`);
		};
	}, [currentTrack]);

	if (error) {
		return (
			<div className="min-h-dvh bg-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-500 text-xl">{error}</p>
				</div>
			</div>
		);
	}

	if (!sdk) {
		return (
			<div className="min-h-dvh bg-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<Music2 className="w-16 h-16 mx-auto mb-4" />
					<p className="text-xl">Connecting to Spotify...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-neutral-900-- text-white flex flex-col relative">
			<DynamicBackgroundTEST imageUrl={currentTrack?.album?.images[0]?.url} isPlaying={isPlaying} />
			<ImageFlipper track={currentTrack} prevTrack={previousTrackRef.current} />
			<Search />
		</div>
	);
}

export const ImageFlipper = memo(function ImageFlipper({ track, prevTrack }: { track: SpotifyTrack | null, prevTrack: SpotifyTrack | null }) {
	const { sdk, queue, currentTrack, isPlaying, progress, duration } = useSpotify();
	const { openDrawer } = useDrawer();
	const [isFlipping, setIsFlipping] = useState(false);
	const { lyricsVisible } = useLyrics();
	const imagesRef = useRef<HTMLDivElement>(null);

	const handleFlip = () => {
		console.log("FLIP");
		setIsFlipping(true);
		
		imagesRef.current?.classList.add('animate');

		// Cast firstChild to HTMLElement to access getAnimations
		const firstChild = imagesRef.current?.firstChild as HTMLElement;
		let animations = firstChild?.getAnimations?.()?.map(animation => animation.finished);
		
		if (!animations) {
			setIsFlipping(false);
			return;
		}

		Promise.allSettled(animations).then(() => {
			imagesRef.current?.classList.remove('images', 'animate');
			setTimeout(() => {

				let images = imagesRef.current?.querySelectorAll('img');
				if (!images) return;
				let prevImage = images[0];
				let currentImage = images[1];

				prevImage.src = track?.album?.images[0]?.url || '';
				currentImage.src = prevTrack?.album?.images[0]?.url || '';

				imagesRef.current?.classList.add('images');
				setIsFlipping(false);
			}, 100);
		});
	};

	// On first render, flip the image
	useEffect(() => {
		handleFlip();
		prevTrack = track;
	}, []);

	// Automatically flip when the current track changes
	useEffect(() => {
		console.log("PREV:", prevTrack?.name, "CURR:", track?.name);
		if (prevTrack === null) {

			// let images = imagesRef.current?.querySelectorAll('img');
			// if (!images) return;
			// let prevImage = images[0];

			// prevImage.src = track?.album?.images[0]?.url || '';
			// images[1].src = track?.album?.images[0]?.url || '';
			// prevImage.alt = `${track?.name} - ${getArtists(track?.artists || [])}`;
			prevTrack = track;
		}
		if (track && prevTrack && track.id !== prevTrack.id) {
			handleFlip();
		}
	}, [track]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const { key } = event;

			if (key === "ArrowLeft") {
				sdk?.player.skipToPrevious();
			} else if (key === "ArrowRight") {
				sdk?.player.skipToNext();
			} else if (key === "Space") {
				isPlaying ? 
					sdk?.player.pausePlayback() : 
					sdk?.player.startResumePlayback();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isPlaying]);

	if (!track || !currentTrack) return null;

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(e.target.value);
		sdk?.player.seekToPosition(value);
	};

	const containerClasses = lyricsVisible
		? "min-h-dvh"
		: "min-h-dvh grid place-items-center";

	const wrapperClasses = lyricsVisible
		? "sticky top-0 p-3 z-20 [perspective:1500px] grid grid-cols-[3.5rem_auto_auto] w-fit grid-rows-1 [grid-template-areas:_'._info'] gap-3"
		: "relative size-80 [perspective:1500px] grid grid-rows-[20rem_auto] grid-cols-1 [grid-template-areas:_'.'_'info']";

	const albumCoverClasses = `${lyricsVisible && false ? "rounded-sm" : "rounded-lg"} w-full h-full object-cover shadow-lg absolute`;
	const textAreaClasses = `${lyricsVisible && false ? "text-left" : "text-center"} my-3 [grid-area:info] [filter:drop-shadow(0_1px_10px_var(--color))] transition-[filter] pointer-events-auto cursor-default`;

	function parseArtists(artists: Artist[]) {
		return artists.map((artist, index) => <span onClick={() => openArtist(artist.id, sdk, openDrawer)} data-id={artist.id} className={`${(index < artists.length - 1) ? `after:content-[",_"]`: ``}`}><span className='hover:underline'>{artist.name}</span></span>);
	}

	return (
		<div className={containerClasses}>
			{/* {lyricsVisible && <LinearBlur/> } */}
			<div className={wrapperClasses}>
				<div className='relative grid aspect-square'>
					<div className='relative images' ref={imagesRef}>
						<img
							src={prevTrack?.album?.images[0]?.url}
							alt={`${prevTrack?.name} - ${prevTrack?.artists[0]?.name}`}
							className={albumCoverClasses}
						/>
						<img
							src={track?.album?.images[0]?.url}
							alt={`${track?.name} - ${track?.artists[0]?.name}`}
							className={albumCoverClasses}
						/>
					</div>
					<div className='absolute inset-0 overflow-hidden grid rounded-lg z-10'>
						{!isFlipping && (
							<div className="absolute pointer-events-auto rounded-lg w-full h-full flex items-center justify-center gap-3 bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 [scale:1.05] hover:[scale:1] blur-sm hover:blur-none">
								<button
									type='button'
									className='pointer-events-auto active:scale-95 transition-all duration-300'
									onClick={() => sdk?.player.skipToPrevious()}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 20 9 12l10-8zM5 19V5" /></svg>
								</button>
								<button
									type='button'
									className='pointer-events-auto active:scale-95 transition-all duration-300'
									onClick={() => isPlaying ? 
										sdk?.player.pausePlayback() : 
										sdk?.player.startResumePlayback()}
								>
									{isPlaying ?
										<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" /></svg>
										:
										<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 3 14 9-14 9z" /></svg>
									}
								</button>
								<button
									type='button'
									className='pointer-events-auto active:scale-95 transition-all duration-300'
									onClick={() => sdk?.player.skipToNext()}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" x2="19" y1="5" y2="19" /></svg>
								</button>
								<div className="slider-wrap absolute bottom-4">
									<div className="slider">
										<input
											type="range" min={0} max={duration} value={progress}
											onInput={handleSeek}
										/>
										<div className="slider__track"></div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className={textAreaClasses}>
					<p id="song-title" className="text-sm font-medium [view-transition-name:song-title]" onClick={() => openAlbum(currentTrack.album.id, sdk, openDrawer)}>
						<span className='hover:underline'>{currentTrack?.name}</span>
					</p>
					<p id="song-artist" className="text-xs text-white transition-colors [view-transition-name:song-artist] opacity-60">
						{parseArtists(currentTrack?.artists || [])}
					</p>
				</div>
				<div className="my-3 text-center">
					<LyricsDisplay.Button />
				</div>
			</div>
			{lyricsVisible && <LyricsDisplay.Lyrics />}
			{/* {lyricsVisible && <LinearBlur className={"[transform:rotateX(180deg)] [inset:auto_0_-160px_!important]"}/> } */}
		</div>
	);
});


function parseArtists(artists: Artist[], sdk: SpotifyApi, openDrawer: Function) {
	return artists.map((artist, index) => <span onClick={() => openArtist(artist.id, sdk, openDrawer)} data-id={artist.id} className={`${(index < artists.length - 1) ? `after:content-[",_"]`: ``}`}><span className='hover:underline'>{artist.name}</span></span>);
}


export async function openArtist(id: string, sdk: SpotifyApi, openDrawer: Function) {
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

		const header = <div className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip cursor-default`} style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}>
			<img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
			<div className="blur-vignette"></div>
			<Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>{name}</Drawer.Title>
		</div>;

		console.log(albumsResponse);
		const albums = albumsResponse?.items.filter(({ album_type }) => album_type === "album") || [];

		const cont = <div className='flex flex-col flex-1 gap-3 px-2 py-5 cursor-default' style={{ color: `rgb(${textColor})`,  background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` }}>
			<p>Tracks</p>
			{topTracksResponse?.tracks.map((track, i) => {
				const total = topTracksResponse.tracks.length;
				const blendPercentage = 100 - Math.floor((i / (total - 1)) * 100);

				return (
					<ContextMenuDemo
						track={track as SpotifyTrack}
						 trigger={
							<div key={track.id || i} className='flex gap-3'>
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
									<span className='text-xs line-clamp-1'>{parseArtists(track.artists, sdk, openDrawer)}</span>
								</div>
							</div>
						}
					/>
				);
			})}
			{albums.length > 0 && <p>Albums</p>}
			<div className='grid gap-3 overflow-auto w-full [scrollbar-width:_none]' style={{gridTemplateColumns: `repeat(${albums.length}, 96px)`}}>
				{albums.map((album, i) => 
					(
						<div key={album.id || i} className='flex flex-col gap-1 items-stretch' onClick={() => openAlbum(album.id, sdk, openDrawer)}>
							<img 
								src={album.images[0].url} 
								alt={album.name} 
								className='size-24 aspect-square rounded pointer-events-none w-full' 
							/>
							<div className='text-center'>
								<span className='mix-blend-multiply_ line-clamp-1 text-xs break-all'>{album.name}</span>
							</div>
						</div>
					)
				)}
			</div>
		</div>;

		openDrawer({
			title: "",
			header: header,
			content: cont
		});
	};
}

export async function openAlbum(id: string, sdk: SpotifyApi, openDrawer: Function) {
	const [albumResponse] = await Promise.all([
		sdk?.albums.get(id)
	]);

	if (!albumResponse) return;
	console.log(albumResponse);

	let imageUrl = albumResponse.images[0].url;
	let name = albumResponse.name;

	const img = new Image();
	img.crossOrigin = 'Anonymous';
	img.src = imageUrl || "";

	img.onload = async () => {
		const colorThief = new ColorThief();
		const dominantColor = colorThief.getColor(img);
		const textColor = getTextColor(dominantColor);

		const header = <div className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip cursor-default`} style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}>
			<img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
			<div className="blur-vignette"></div>
			<Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>{name}</Drawer.Title>
		</div>;

		const groupByDisc = Object.groupBy(albumResponse.tracks.items, ({ disc_number }) => disc_number);

		const cont = <div className='flex flex-col flex-1 gap-3 px-2 cursor-default' style={{ color: `rgb(${textColor})`,  background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` }}>
			<p className='flex items-center gap-1'>
				{/* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg> */}
				{parseArtists(albumResponse.artists, sdk, openDrawer)}
			</p>
			<p>Tracks</p>
			<ol className='flex flex-col gap-2'>
				{Object.entries(groupByDisc)
					?.map(([no, tracks], _, array) => {
						return <div className='contents'>
							{array.length > 1 ? <p className='flex items-center gap-1'>
								<svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.03 15.53a6.53 6.53 0 1 0 0-13.06 6.53 6.53 0 0 0 0 13.06Z" stroke="currentcolor" strokeWidth="1.5"/><path d="M8.03 10.306a1.306 1.306 0 1 0 0-2.612 1.306 1.306 0 0 0 0 2.612Z" stroke="currentcolor" strokeWidth=".75"/></svg>
								Disc {no}
							</p> : null}
							{tracks.map((track, i) => 
								{
									const total = albumResponse.total_tracks;
									const blendPercentage = 100 - Math.floor((i / (total - 1)) * 100);

									return (
										<ContextMenuDemo
											track={track as SpotifyTrack}
											trigger={
												<li key={track.id || i} className='flex'>
													<span className='text-xs mt-1 w-5'>{i + 1}. </span>
													<div 
														className='flex flex-col flex-1' 
														style={{
															color: `color-mix(in srgb, rgb(${textColor}) ${blendPercentage}%, white)`
														}}
													>
														<span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
														<span className='text-xs line-clamp-1'>{parseArtists(track.artists, sdk, openDrawer)}</span>
													</div>
												</li>
											}
										/>
									);
								}
							)}
						</div>
					})
				}
			</ol>
			<p className='text-xs'>{albumResponse.release_date}</p>
			<p className='text-xs -mt-2'>{albumResponse.label}</p>
		</div>;

		openDrawer({
			title: "",
			header: header,
			content: cont
		});
	};
}

const Profile = () => {
	const { sdk } = useSpotify();
	const { openDrawer } = useDrawer();
	const [profile, setProfile] = useState<SpotifyApi.CurrentUsersProfileResponse | null>(null);

	useEffect(() => {
		if (!sdk) return;
		sdk.currentUser.profile().then(setProfile);
	}, [sdk]);

	if (!profile) return null;

	const u = () => {
		if (!profile) return;
		console.log(profile);
		
		let imageUrl = profile.images[0].url;
		let name = profile.display_name;

		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = imageUrl || "";

		img.onload = async () => {
			const colorThief = new ColorThief();
			const dominantColor = colorThief.getColor(img);
			const textColor = getTextColor(dominantColor);

			const header = <div className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip`} style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}>
				<img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
				<div className="blur-vignette"></div>
				<Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>{name}</Drawer.Title>
			</div>;

			const cont = <div className='flex flex-col flex-1 gap-3 px-2 py-5' style={{ color: `rgb(${textColor})`,  background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` }}>
				<p>Top Tracks</p>
				<ol className='flex flex-col gap-2'>
				</ol>
			</div>;

			openDrawer({
				title: "",
				header: header,
				content: cont
			});
		}
	};

	return (
		<button onClick={() => u()}>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>
		</button>
	);
};

const Track = ({ track }: { track: SpotifyTrack}) => {
	const { sdk } = useSpotify();
	const { openDrawer } = useDrawer();

	return <ContextMenuDemo
		track={track}
	 	trigger={
			<div key={track.id} className='flex gap-3'>
				<img 
					src={track.album.images[0].url} 
					alt={track.name} 
					className='size-10 rounded pointer-events-none' 
				/>
				<div className='flex flex-col'>
					<span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
					<span className='text-xs line-clamp-1'>{parseArtists(track.artists, sdk, openDrawer)}</span>
				</div>
			</div>
		}
	/>
};

const Library = () => {
	const { sdk } = useSpotify();
	if (!sdk) return;
	const { openDrawer, updateDrawer } = useDrawer();
	const [tracks, setTracks] = useState<Page<SavedTrack> | null>(null);
	const [drawerId, setDrawerId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!sdk) return;
		sdk.currentUser.tracks.savedTracks().then(setTracks);
	}, [sdk]);

	if (!tracks) return null;

	const loadMoreTracks = async () => {
		if (!sdk || !tracks.next || isLoading) return;
		
		setIsLoading(true);
		try {
			const nextTracks = await sdk.currentUser.tracks.savedTracks(50, tracks.items.length);
			setTracks(prev => {
				if (!prev) return nextTracks;
				return {
					...nextTracks,
					items: [...prev.items, ...nextTracks.items]
				};
			});
		} catch (error) {
			console.error('Error loading more tracks:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const openLibrary = () => {
		if (!tracks) return;
		
		const header = <div className='backdrop-blur-[300px] bg-black/40 flex flex-col font-medium gap-2 p-3 sticky top-0 text-center text-white'>
			Your Library
		</div>;

		const content = <div className='flex flex-col gap-2 p-3'>
			{tracks.items.map((savedTrack, i) => {
				const track = savedTrack.track as SpotifyTrack;
				return (
					<Track key={track.id || i} track={track}/>
				);
			})}
			{isLoading && (
				<div className="flex justify-center p-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
				</div>
			)}
		</div>;

		const id = openDrawer({
			title: "Library",
			header: header,
			content: content,
			onScrollToBottom: loadMoreTracks,
			isLoading: isLoading
		});
		setDrawerId(id);
	};

	return (
		<button onClick={openLibrary}>
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
		</button>
	);
};


export function getArtists(artists: { name: string, id: string }[]) {
	return artists.map(artist => artist.name).join(', ');
}

const Queue = () => {
	const { sdk, queue, refreshQueue } = useSpotify();
	if (!sdk) return;
	const { openDrawer, updateDrawer } = useDrawer();
	const [drawerId, setDrawerId] = useState<string | null>(null);

	// const open = async () => {
	// 	await refreshQueue();
	// 	const id = openDrawer({
	// 		title: "Queue",
	// 		header: <div>Queue</div>,
	// 		content: <div className='bg-black/40 text-white p-3 flex flex-col gap-2 flex-1'>
	// 			{queue.map((track, i) => 
	// 				<ContextMenuDemo
	// 					track={track as SpotifyTrack}
	// 					 trigger={
	// 						<div key={track.id || i} className='flex gap-3'>
	// 							<img 
	// 								src={track.album.images[0].url} 
	// 								alt={track.name} 
	// 								className='size-10 rounded pointer-events-none' 
	// 							/>
	// 							<div className='flex flex-col'>
	// 								<span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
	// 								<span className='text-xs line-clamp-1'>{parseArtists(track.artists, sdk, openDrawer)}</span>
	// 							</div>
	// 						</div>
	// 					}
	// 				/>)
	// 			}
	// 		</div>
	// 	});
	// 	setDrawerId(id);
	// }
	const open = async () => {
		await refreshQueue();
		const id = openDrawer({
			title: "Queue",
			header: <div className='backdrop-blur-[300px] bg-black/40 flex flex-col font-medium gap-2 p-3 sticky top-0 text-center text-white'>Queue</div>,
			content: <QueueDrawer/>
		});
		setDrawerId(id);
	}

	// useEffect(() => {
	// 	if (drawerId) {
	// 		updateDrawer(drawerId, {
	// 			content: <div className='bg-black/40 text-white p-3 flex flex-col gap-2'>
	// 				{queue.map((track, i) => 
	// 					<ContextMenuDemo
	// 						track={track as SpotifyTrack}
	// 						 trigger={
	// 							<div key={track.id || i} className='flex gap-3'>
	// 								<img 
	// 									src={track.album.images[0].url} 
	// 									alt={track.name} 
	// 									className='size-10 rounded pointer-events-none' 
	// 								/>
	// 								<div className='flex flex-col'>
	// 									<span className='mix-blend-multiply_ line-clamp-1'>{track.name}</span>
	// 									<span className='text-xs line-clamp-1'>{parseArtists(track.artists, sdk, openDrawer)}</span>
	// 								</div>
	// 							</div>
	// 						}
	// 					/>)
	// 				}
	// 			</div>
	// 		});
	// 	}
	// }, [queue]);

	return <button onClick={open}>
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6m-2.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M12 12H3m13-6H3m9 12H3"/></svg>
	</button>;
};

const Options = () => {
	const [open, setOpen] = useState(false);
	const toggle = () => setOpen(!open);

	return <div className='fixed right-0 left-0 bottom-0 z-20 mx-auto pt-12 flex flex-col group'>
		<motion.div className={`rounded-full backdrop-blur-sm mx-auto text-[--text-color] group-hover:mb-2 group-hover:shadow-[0_0_0_1px_rgb(from_var(--color)_r_g_b_/_60%)] group-hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2 ${open ? "scale-100 mb-2 px-3 py-1" : "scale-50 aspect-square px-2 hover:bg-[rgb(from_var(--color)_r_g_b_/_60%)]"}`}>
			<button onClick={toggle} type='button' className='py-1 rounded-t-lg transition-all'>
				<div className="sr-only">Open</div>
				<svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto transition-transform ${open ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
			</button>
			{open && <div className='contents'>
				<Queue/>
				<Library/>
				<Profile/>
			</div>}
		</motion.div>
	</div>;
}


function App() {
	return (
		<SpotifyProvider>
			<DrawerProvider>
				<LyricsProvider>
					<Options/>
					<AppContent />
					<Toaster />
					{/* <Profile/> */}
				</LyricsProvider>
			</DrawerProvider>
		</SpotifyProvider>
	);
}


async function openInteractivePiP() {
	// 1. Request the PiP Window
	const pipWindow = await documentPictureInPicture.requestWindow({
	  width: 500,
	  height: 500,
	});
  
	// 2. Copy Stylesheets (Essential for look and feel)
	[...document.styleSheets].forEach((sheet) => {
	  try {
		const css = [...sheet.cssRules].map((rule) => rule.cssText).join('');
		const style = pipWindow.document.createElement('style');
		style.textContent = css;
		pipWindow.document.head.appendChild(style);
	  } catch (e) {
		const link = pipWindow.document.createElement('link');
		link.rel = 'stylesheet';
		link.type = sheet.type;
		link.media = sheet.media;
		link.href = sheet.href;
		pipWindow.document.head.appendChild(link);
	  }
	});
  
	// 3. Sync Root (HTML) Attributes
	// Copy inline styles from the <html> element (crucial for CSS vars defined on :root)
	pipWindow.document.documentElement.style.cssText = document.documentElement.style.cssText;
	
	// Add a specific class to the PiP <html> element so you can target it in CSS
	pipWindow.document.documentElement.classList.add('pip-mode');
  
	// 4. MOVE the content
	// We reference the original container
	const originalContainer = document.body;
	
	// Move all children from main window to PiP window
	// (We use a spread ... to freeze the list of nodes so we don't skip any while moving)
	const elementsToMove = [...originalContainer.children];
	pipWindow.document.body.append(...elementsToMove);
  
	// Copy the main body's class list to the PiP body
	pipWindow.document.body.className = originalContainer.className;
  
	// 5. Placeholder for the main window (Optional but recommended)
	const placeholder = document.createElement('div');
	placeholder.id = 'pip-placeholder';
	placeholder.innerText = "Content is active in Picture-in-Picture mode.";
	placeholder.style.cssText = "display:flex; justify-content:center; align-items:center; height:100vh; color:#888;";
	originalContainer.appendChild(placeholder);
  
	// 6. THE RETURN MECHANISM
	// When PiP closes, move everything back
	pipWindow.addEventListener("pagehide", (event) => {
	  const pipContainer = pipWindow.document.body;
	  const elementsToReturn = [...pipContainer.children];
	  
	  // Remove placeholder
	  const existingPlaceholder = document.getElementById('pip-placeholder');
	  if (existingPlaceholder) existingPlaceholder.remove();
  
	  // Return elements to original window
	  originalContainer.append(...elementsToReturn);
	});
  }
  
  // Trigger setup (Browser requires user gesture)
  if ('documentPictureInPicture' in window) {
	const btn = document.createElement('button');
	btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>`;
	btn.style.cssText = "position: fixed; top: 15px; right: 15px; z-index: 9999;color: var(--text-color);";
	btn.onclick = openInteractivePiP;
	document.body.appendChild(btn);
  }


export default App;