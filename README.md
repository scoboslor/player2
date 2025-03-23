# Spotify Player Web App

An enhanced music player experience.

![Example GIF](ex.gif)

## Features

- 🎵 Spotify Integration: Connect and control your Spotify playback
- 🎨 Dynamic Color Extraction: Visual elements adapt to your music's color scheme
- ⚡ Modern UI: Built with React and TypeScript for a smooth user experience
- 🎭 Lyrics: Real-time synchronized lyrics display with karaoke-style highlighting and scrolling

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Spotify Web API SDK
- ColorThiefs
- Sonner (Toast notifications)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Spotify Developer Account and API credentials

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Add your Spotify API credentials to the `.env` file

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To preview the production build:

```bash
npm run preview
# or
yarn preview
```

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
```

## License

This project is private and proprietary.
