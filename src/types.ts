export interface LyricsLine {
  words: string;
  startTimeMs: string;
  endTimeMs: string;
}

export interface LyricsResponse {
  error: boolean;
  syncType: string;
  lines: LyricsLine[];
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: 'artist';
  images?: SpotifyImage[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  type: 'album';
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  type: 'track';
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  href: string;
  is_local: boolean;
  preview_url: string | null;
  track: boolean;
  track_number: number;
  uri: string;
  is_playable?: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  type: 'playlist';
  images: SpotifyImage[];
}

export type SpotifyItem = SpotifyTrack | SpotifyArtist | SpotifyAlbum | SpotifyPlaylist;