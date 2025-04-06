import React, { useState, memo, useEffect, useMemo, useRef } from 'react';
import { Toaster } from 'sonner'
import { Music2 } from 'lucide-react';
import { LyricsDisplay } from './components/LyricsDisplay';
import { DynamicBackground, DynamicBackgroundTEST } from './components/DynamicBackground.tsx';
import { Search } from './components/Search';
import type { LyricsResponse, SpotifyImage, SpotifyTrack } from './types';
import { motion, AnimatePresence } from "framer-motion";
import ColorThief from 'colorthief';
import { SpotifyProvider, useSpotify } from './contexts/SpotifyContext';
import { LyricsProvider, useLyrics } from './contexts/LyricsContext';


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
			<div className="h-dvh bg-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-500 text-xl">{error}</p>
				</div>
			</div>
		);
	}

	if (!sdk) {
		return (
			<div className="h-dvh bg-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<Music2 className="w-16 h-16 mx-auto mb-4" />
					<p className="text-xl">Connecting to Spotify...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-dvh bg-neutral-900-- text-white flex flex-col relative">
			<DynamicBackgroundTEST imageUrl={currentTrack?.album?.images[0]?.url} isPlaying={isPlaying} />
			<ImageFlipper track={currentTrack} prevTrack={previousTrackRef.current} />
			<Search />
		</div>
	);
}


// export const ImageFlipper = memo(function ImageFlipper({ track, prevTrack }: { track: SpotifyTrack | null, prevTrack: SpotifyTrack | null }) {
// 	const { sdk, queue, currentTrack, isPlaying, progress, duration } = useSpotify();
// 	const [currentIndex, setCurrentIndex] = useState(0);
// 	const [nextIndex, setNextIndex] = useState(1);
// 	const [isFlipping, setIsFlipping] = useState(false);
// 	const { lyricsVisible } = useLyrics();
// 	const imagesRef = useRef<HTMLDivElement>(null);

// 	const handleFlip = () => {
// 		console.log("FLIP");
		
// 		imagesRef.current?.classList.add('animate');

// 		// Cast firstChild to HTMLElement to access getAnimations
// 		const firstChild = imagesRef.current?.firstChild as HTMLElement;
// 		let animations = firstChild?.getAnimations?.()?.map(animation => animation.finished);
		
// 		if (!animations) return;

// 		Promise.allSettled(animations).then(() => {
// 			imagesRef.current?.classList.remove('images', 'animate');

// 			let images = imagesRef.current?.querySelectorAll('img');
// 			if (!images) return;
// 			let prevImage = images[0];
// 			let currentImage = images[1];

// 			prevImage.src = track?.album?.images[0]?.url || '';
// 			currentImage.src = prevTrack?.album?.images[0]?.url || '';

// 			imagesRef.current?.classList.add('images');
// 		});
// 	};

// 	// On first render, flip the image
// 	useEffect(() => {
// 		handleFlip();
// 	}, []);

// 	// Automatically flip when the current track changes
// 	useEffect(() => {
// 		console.log("PREV:", prevTrack?.name, "CURR:", track?.name);
// 		if (prevTrack === null) {

// 			let images = imagesRef.current?.querySelectorAll('img');
// 			if (!images) return;
// 			let prevImage = images[0];

// 			prevImage.src = track?.album?.images[0]?.url || '';
// 			prevImage.alt = `${track?.name} - ${getArtists(track?.artists || [])}`;
// 		}
// 		if (track && prevTrack && track.id !== prevTrack.id) {
// 			handleFlip();
// 		}
// 	}, [track]);

// 	if (!track || !currentTrack) return null;

// 	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		const value = parseInt(e.target.value);
// 		sdk?.player.seekToPosition(value);
// 	};

// 	const containerClasses = lyricsVisible
// 		? "h-dvh"
// 		: "h-dvh grid place-items-center";

// 	const wrapperClasses = lyricsVisible
// 		? "sticky top-0 p-3 [perspective:1500px] grid grid-cols-[3.5rem_auto_auto] w-fit grid-rows-1 [grid-template-areas:_'._info'] gap-3"
// 		: "relative size-80 [perspective:1500px] grid grid-rows-[20rem_auto] grid-cols-1 [grid-template-areas:_'.'_'info']";

// 	const albumCoverClasses = lyricsVisible ? "rounded-sm" : "rounded-lg";
// 	const textAreaClasses = `${lyricsVisible ? "text-left" : "text-center"} my-3 [grid-area:info] [filter:drop-shadow(0_1px_10px_var(--color))]`;

// 	return (
// 		<motion.div layout className={containerClasses}>
// 			<div className='size-28 relative images [scale:2]' ref={imagesRef}>
// 				<img
// 					src={prevTrack?.album?.images[0]?.url}
// 					alt={`${prevTrack?.name} - ${prevTrack?.artists[0]?.name}`}
// 					className="w-full h-full object-cover shadow-lg absolute"
// 				/>
// 				<img
// 					src={track?.album?.images[0]?.url}
// 					alt={`${track?.name} - ${track?.artists[0]?.name}`}
// 					className="w-full h-full object-cover shadow-lg absolute"
// 				/>
// 			</div>
// 			<motion.div layout className={wrapperClasses}>
// 				<AnimatePresence mode="wait">
// 					<motion.div
// 						layout
// 						key={`view-${track?.id}`}
// 						initial={{ rotateY: isFlipping ? 0 : 180 }}
// 						animate={{ rotateY: isFlipping ? 180 : 0 }}
// 						exit={{ rotateY: isFlipping ? 180 : 0 }}
// 						transition={{ duration: 0.5 }}
// 						className={albumCoverClasses}
// 						style={{ transformStyle: "preserve-3d", width: "100%", aspectRatio: 1, overflow: "hidden" }}
// 					>
// 						{/* Front - Current Image */}
// 						<motion.div layout className="absolute w-full h-full pointer-events-none" style={{ backfaceVisibility: "hidden" }}>
// 							<img
// 								src={track?.album?.images[0]?.url}
// 								alt={`${track?.name} - ${track?.artists[0]?.name}`}
// 								className="w-full h-full object-cover shadow-lg"
// 							/>
// 						</motion.div>
// 						{/* Back - Next Image */}
// 						<motion.div
// 							className="absolute w-full h-full pointer-events-none shadow-lg"
// 							style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
// 						>
// 							<img
// 								src={prevTrack?.album?.images[0]?.url}
// 								alt={`${prevTrack?.name} - ${prevTrack?.artists[0]?.name}`}
// 								className="w-full h-full object-cover shadow-lg"
// 							/>
// 						</motion.div>
// 						{!isFlipping && !lyricsVisible && (
// 							<motion.div layout className="absolute pointer-events-auto rounded-lg w-full h-full flex items-center justify-center gap-3 bg-black/50 opacity-0 hover:opacity-100 transition-all duration-300 [scale:1.05] hover:[scale:1] blur-sm hover:blur-none">
// 								<button
// 									type='button'
// 									className='pointer-events-auto active:scale-95 transition-all duration-300'
// 									onClick={() => sdk?.player.skipToPrevious()}
// 								>
// 									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 20 9 12l10-8zM5 19V5" /></svg>
// 								</button>
// 								<button
// 									type='button'
// 									className='pointer-events-auto active:scale-95 transition-all duration-300'
// 									onClick={() => isPlaying ? sdk?.player.pausePlayback() : sdk?.player.startResumePlayback()}
// 								>
// 									{isPlaying ?
// 										<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" /></svg>
// 										:
// 										<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 3 14 9-14 9z" /></svg>
// 									}
// 								</button>
// 								<button
// 									type='button'
// 									className='pointer-events-auto active:scale-95 transition-all duration-300'
// 									onClick={() => sdk?.player.skipToNext()}
// 								>
// 									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" x2="19" y1="5" y2="19" /></svg>
// 								</button>
// 								<div className="slider-wrap absolute bottom-4">
// 									<div className="slider">
// 										<input
// 											type="range" min={0} max={duration} value={progress}
// 											onInput={handleSeek}
// 										/>
// 										<div className="slider__track"></div>
// 									</div>
// 								</div>
// 							</motion.div>
// 						)}
// 					</motion.div>
// 				</AnimatePresence>
// 				<motion.div layout className={textAreaClasses}>
// 					<motion.p
// 						layout
// 						// layout
// 						// key={`title-${currentTrack?.name}`}
// 						// transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
// 						// initial={{ y: -25, opacity: 0 }}
// 						// animate={{ y: 0, opacity: 1 }}
// 						// exit={{ y: 25, opacity: 0 }}
// 						className="text-sm font-medium"
// 					>
// 						{currentTrack?.name}
// 					</motion.p>
// 					<motion.p
// 						layout
// 						// layout
// 						// key={`artist-${getArtists(currentTrack?.artists)}`}
// 						// transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
// 						// initial={{ y: -25, opacity: 0 }}
// 						// animate={{ y: 0, opacity: 1 }}
// 						// exit={{ y: 25, opacity: 0 }}
// 						className="text-xs text-[var(--text-color)]"
// 					>
// 						{getArtists(currentTrack?.artists || [])}
// 					</motion.p>
// 				</motion.div>
// 				<div className="my-3 text-center">
// 					<LyricsDisplay.Button />
// 				</div>
// 			</motion.div>
// 			{lyricsVisible && <LyricsDisplay.Lyrics />}
// 		</motion.div>
// 	);
// });

export const ImageFlipper = memo(function ImageFlipper({ track, prevTrack }: { track: SpotifyTrack | null, prevTrack: SpotifyTrack | null }) {
	const { sdk, queue, currentTrack, isPlaying, progress, duration } = useSpotify();
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
			isPlaying ? sdk?.player.pausePlayback() : sdk?.player.startResumePlayback();
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
		? "h-dvh"
		: "h-dvh grid place-items-center";

	const wrapperClasses = lyricsVisible
		? "sticky top-0 p-3 z-20 [perspective:1500px] grid grid-cols-[3.5rem_auto_auto] w-fit grid-rows-1 [grid-template-areas:_'._info'] gap-3"
		: "relative size-80 [perspective:1500px] grid grid-rows-[20rem_auto] grid-cols-1 [grid-template-areas:_'.'_'info']";

	const albumCoverClasses = `${lyricsVisible ? "rounded-sm" : "rounded-lg"} w-full h-full object-cover shadow-lg absolute`;
	const textAreaClasses = `${lyricsVisible ? "text-left" : "text-center"} my-3 [grid-area:info] [filter:drop-shadow(0_1px_10px_var(--color))] transition-[filter]`;

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
									onClick={() => isPlaying ? sdk?.player.pausePlayback() : sdk?.player.startResumePlayback()}
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
					<p id="song-title" className="text-sm font-medium [view-transition-name:song-title]">
						{currentTrack?.name}
					</p>
					<p id="song-artist" className="text-xs text-[var(--text-color)] transition-colors [view-transition-name:song-artist]">
						{getArtists(currentTrack?.artists || [])}
					</p>
				</div>
				<div className="my-3 text-center">
					<LyricsDisplay.Button />
				</div>
			</div>
			{lyricsVisible && <LyricsDisplay.Lyrics />}
		</div>
	);
});

export function getArtists(artists: { name: string }[]) {
	return artists.map(artist => artist.name).join(', ');
}

const LinearBlur = () => {
	return (
	  <div 
		style={{
		  pointerEvents: 'none',
		  transformOrigin: 'center top',
		  position: 'fixed',
		  inset: 0,
		  top: "-15px",
		  bottom: 'auto',
		  height: '120px',
		  zIndex: 10
		}}
	  >
		<div 
		  style={{
			position: 'relative',
			zIndex: 0,
			width: '100%',
			height: '100%',
			background: 'linear-gradient(rgba(69, 69, 69, 0) 0%, rgba(69, 69, 69, 0) 100%)',
		  }}
		>
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 1,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgb(0, 0, 0) 5%, rgba(0, 0, 0, 0) 16.875%)',
			  WebkitMaskImage: 'linear-gradient(rgb(0, 0, 0) 5%, rgba(0, 0, 0, 0) 16.875%)',
			  backdropFilter: 'blur(25px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 2,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgb(0, 0, 0) 5%, rgb(0, 0, 0) 16.875%, rgba(0, 0, 0, 0) 28.75%)',
			  WebkitMaskImage: 'linear-gradient(rgb(0, 0, 0) 5%, rgb(0, 0, 0) 16.875%, rgba(0, 0, 0, 0) 28.75%)',
			  backdropFilter: 'blur(14.3px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 2,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 5%, rgb(0, 0, 0) 16.875%, rgb(0, 0, 0) 28.75%, rgba(0, 0, 0, 0) 40.625%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 5%, rgb(0, 0, 0) 16.875%, rgb(0, 0, 0) 28.75%, rgba(0, 0, 0, 0) 40.625%)',
			  backdropFilter: 'blur(8.2px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 3,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 16.875%, rgb(0, 0, 0) 28.75%, rgb(0, 0, 0) 40.625%, rgba(0, 0, 0, 0) 52.5%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 16.875%, rgb(0, 0, 0) 28.75%, rgb(0, 0, 0) 40.625%, rgba(0, 0, 0, 0) 52.5%)',
			  backdropFilter: 'blur(4.7px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 4,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 28.75%, rgb(0, 0, 0) 40.625%, rgb(0, 0, 0) 52.5%, rgba(0, 0, 0, 0) 64.375%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 28.75%, rgb(0, 0, 0) 40.625%, rgb(0, 0, 0) 52.5%, rgba(0, 0, 0, 0) 64.375%)',
			  backdropFilter: 'blur(2.7px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 5,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 40.625%, rgb(0, 0, 0) 52.5%, rgb(0, 0, 0) 64.375%, rgba(0, 0, 0, 0) 76.25%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 40.625%, rgb(0, 0, 0) 52.5%, rgb(0, 0, 0) 64.375%, rgba(0, 0, 0, 0) 76.25%)',
			  backdropFilter: 'blur(1.5px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 6,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 52.5%, rgb(0, 0, 0) 64.375%, rgb(0, 0, 0) 76.25%, rgba(0, 0, 0, 0) 88.125%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 52.5%, rgb(0, 0, 0) 64.375%, rgb(0, 0, 0) 76.25%, rgba(0, 0, 0, 0) 88.125%)',
			  backdropFilter: 'blur(0.9px)'
			}}
		  />
		  <div 
			style={{
			  position: 'absolute',
			  zIndex: 7,
			  inset: '0px',
			  maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 64.375%, rgb(0, 0, 0) 76.25%, rgb(0, 0, 0) 88.125%, rgba(0, 0, 0, 0) 100%)',
			  WebkitMaskImage: 'linear-gradient(rgba(0, 0, 0, 0) 64.375%, rgb(0, 0, 0) 76.25%, rgb(0, 0, 0) 88.125%, rgba(0, 0, 0, 0) 100%)',
			  backdropFilter: 'blur(0.5px)'
			}}
		  />
		</div>
	  </div>
	);
};

function App() {
	return (
		<SpotifyProvider>
			<LyricsProvider>
				<AppContent />
				<Toaster />
			</LyricsProvider>
		</SpotifyProvider>
	);
}

export default App;