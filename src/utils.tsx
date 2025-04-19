import { useSpotify } from "./contexts/SpotifyContext"; 

export const LinearBlur = ({ className }:{ className?: String }) => {
	return (
	  <div 
		style={{
		  pointerEvents: 'none',
		  transformOrigin: 'center top',
		  position: 'fixed',
		  inset: 0,
		  top: "-15px",
		  bottom: 'auto',
		  height: '135px',
		  zIndex: 10
		}}
		className={className}
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

export function useAddToQueue() {
	const { sdk } = useSpotify();
	
	return async (track: SpotifyTrack) => {
		if (!track || !sdk) return;
		return sdk.player.addItemToPlaybackQueue(track.uri);
	};
}