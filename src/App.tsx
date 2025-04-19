import React, { useState, memo, useEffect, useRef, ReactNode } from 'react';
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
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

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

	const albumCoverClasses = `${lyricsVisible ? "rounded-sm" : "rounded-lg"} w-full h-full object-cover shadow-lg absolute`;
	const textAreaClasses = `${lyricsVisible ? "text-left" : "text-center"} my-3 [grid-area:info] [filter:drop-shadow(0_1px_10px_var(--color))] transition-[filter] pointer-events-auto`;

	function parseArtists(artists: Artist[]) {
		return artists.map((artist, index) => <span onClick={() => openArtist(artist.id, sdk, openDrawer)} data-id={artist.id} className={`${(index < artists.length - 1) ? `after:content-[",_"]`: ``}`}><span className='hover:underline'>{artist.name}</span></span>);
	}

	return (
		<div className={containerClasses}>
			{lyricsVisible && <LinearBlur/> }
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
						{!isFlipping && !lyricsVisible && (
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
					<p id="song-artist" className="text-xs text-[var(--text-color)] transition-colors [view-transition-name:song-artist]">
						{parseArtists(currentTrack?.artists || [])}
					</p>
				</div>
				<div className="my-3 text-center">
					<LyricsDisplay.Button />
				</div>
			</div>
			{lyricsVisible && <LyricsDisplay.Lyrics />}
			{lyricsVisible && <LinearBlur className={"[transform:rotateX(180deg)] [inset:auto_0_-160px_!important]"}/> }
		</div>
	);
});


function parseArtists(artists: Artist[], sdk: SpotifyApi, openDrawer: Function) {
	return artists.map((artist, index) => <span onClick={() => openArtist(artist.id, sdk, openDrawer)} data-id={artist.id} className={`${(index < artists.length - 1) ? `after:content-[",_"]`: ``}`}><span className='hover:underline'>{artist.name}</span></span>);
}


async function openArtist(id: string, sdk: SpotifyApi, openDrawer: Function) {
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

		const header = <div className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip`} style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}>
			<img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
			<div className="blur-vignette"></div>
			<Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>{name}</Drawer.Title>
		</div>;

		console.log(albumsResponse);
		const albums = albumsResponse?.items.filter(({ album_type }) => album_type === "album") || [];

		const cont = <div className='flex flex-col flex-1 gap-3 px-2 py-5' style={{ color: `rgb(${textColor})`,  background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` }}>
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
								<span className='mix-blend-multiply_ line-clamp-1 text-xs'>{album.name}</span>
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

async function openAlbum(id: string, sdk: SpotifyApi, openDrawer: Function) {
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

		const header = <div className={`after:content-[""] after:absolute after:inset-0 after:bg-gradient-to-t relative overflow-clip`} style={{ "--tw-gradient-stops": `rgb(${dominantColor}) 0%, transparent 40%` } as React.CSSProperties}>
			<img src={imageUrl} alt={name} className='pointer-events-none aspect-square object-cover w-full' />
			<div className="blur-vignette"></div>
			<Drawer.Title className={`absolute bottom-0 text-4xl m-2 z-10`} style={{ color: `rgb(${textColor})` }}>{name}</Drawer.Title>
		</div>;

		const cont = <div className='flex flex-col flex-1 gap-3 px-2 py-5' style={{ color: `rgb(${textColor})`,  background: `linear-gradient(180deg, rgb(${dominantColor}), color-mix(in srgb, rgb(${dominantColor}), black))` }}>
			<p>Tracks</p>
			<ol className='flex flex-col gap-2'>
				{albumResponse.tracks.items?.map((track, i) => {
					const total = albumResponse.total_tracks;
					const blendPercentage = 100 - Math.floor((i / (total - 1)) * 100);

					return (
						<ContextMenuDemo
							track={track as SpotifyTrack}
							trigger={
								<li key={track.id || i} className='flex'>
									<span className='text-xs mt-1 w-5'>{i + 1}. </span>
									<div 
										className='flex flex-col' 
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
				})}
			</ol>
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
				<p>Tracks</p>
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
			user
		</button>
	);
};


export function getArtists(artists: { name: string, id: string }[]) {
	return artists.map(artist => artist.name).join(', ');
}

const Queue = () => {
	const { sdk } = useSpotify();
	sdk?.player.getUsersQueue();
	return <div></div>;
};


function App() {
	return (
		<SpotifyProvider>
			<DrawerProvider>
				<LyricsProvider>
					<AppContent />
					<Toaster />
					{/* <Profile/> */}
				</LyricsProvider>
			</DrawerProvider>
		</SpotifyProvider>
	);
}

export default App;