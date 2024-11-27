// src/app/page.tsx
import VideoPlayer from '../components/VideoPlayer';
import path from 'path';
import fs from 'fs';

const shuffleArray = (array: string[]) => {
  return array.sort(() => Math.random() - 0.5);
};

const HomePage = async () => {
  const videosDirectory = path.join(process.cwd(), 'public/Videos/videos_mkx_embedsub');

  let videoFiles: string[] = [];
  try {
    const files = fs.readdirSync(videosDirectory);
    videoFiles = files
      .filter((file) => file.endsWith('.mkv'))
      .map((file) => `/Videos/videos_mkx_embedsub/${encodeURIComponent(file)}`);

    videoFiles = shuffleArray(videoFiles); // Shuffle on server side
  } catch (error) {
    console.error('Error reading video files:', error);
  }

  return (
    <div>
      <h1>My Video Playlist</h1>
      <VideoPlayer videos={videoFiles} />
    </div>
  );
};

export default HomePage;