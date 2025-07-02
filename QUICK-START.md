# TUYU Archives - Quick Start Guide

## Quick Setup 

### Option 1: Local Videos Only
1. ```bash
   npm install
   npm run dev
   ```
2. Put your videos in `public/Videos/videosxd/`
3. Visit `http://localhost:3000`

### Option 2: Google Drive Integration
1. ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local`
3. Get Google Drive API key from [Google Cloud Console](https://console.cloud.google.com/)
4. Add your credentials to `.env.local`
5. ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000/google-drive`

## Controls
- **Click video**: Play/Pause
- **Space**: Play/Pause
- **F**: Fullscreen
- **M**: Mute
- **Search box**: Find videos
- **Folder dropdown**: Filter by album

## Google Drive Folder Structure
```
Your Main Folder/
├── Album 1/
│   ├── song.mp4
│   └── Subtitles/
│       └── song.vtt
└── Album 2/
    ├── song.webm
    └── song.vtt
```

