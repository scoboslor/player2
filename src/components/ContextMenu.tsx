import { useState, ReactNode} from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { SpotifyTrack } from "../types";
import { getArtists, openAlbum } from "../App";
import { useAddToQueue } from "../utils";
import { useSpotify } from "../contexts/SpotifyContext";
import { useDrawer } from "./DrawerManager";

interface Props {
    track: SpotifyTrack;
    trigger: ReactNode;
}

const ContextMenuDemo = ({ track, trigger }: Props) => {
    const addToQueue = useAddToQueue();
	const { sdk, refreshQueue } = useSpotify();
	const { openDrawer } = useDrawer();

	if (!sdk) return;

	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger asChild>
                {trigger}
			</ContextMenu.Trigger>
			<ContextMenu.Portal>
				<ContextMenu.Content
					className="context-menu min-w-[220px] overflow-hidden rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]"
				>
                    <p className="text-xs max-w-[200px] line-clamp-1 break-all mb-1">{track.name} - {getArtists(track.artists)}</p>
					<ContextMenu.Item onClick={() => {addToQueue(track); refreshQueue()}} className="group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] text-[12px] gap-1 leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[--color] data-[disabled]:text-slate-300 data-[highlighted]:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12H3m13-6H3m13 12H3m15-9v6m3-3h-6"/></svg>
                        Add to queue
					</ContextMenu.Item>
					<ContextMenu.Item onClick={() => openAlbum(track.album.id, sdk, openDrawer)} className="group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] text-[12px] gap-1 leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[--color] data-[disabled]:text-slate-300 data-[highlighted]:text-white">
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.03 15.53a6.53 6.53 0 1 0 0-13.06 6.53 6.53 0 0 0 0 13.06Z" stroke="currentcolor" strokeWidth="1.5"/><path d="M8.03 10.306a1.306 1.306 0 1 0 0-2.612 1.306 1.306 0 0 0 0 2.612Z" stroke="currentcolor" strokeWidth=".75"/></svg>
                        View album
					</ContextMenu.Item>

				</ContextMenu.Content>
			</ContextMenu.Portal>
		</ContextMenu.Root>
	);
};

export default ContextMenuDemo;
