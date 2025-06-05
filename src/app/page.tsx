// src/app/page.tsx
import VideoPlayer from '../components/VideoPlayer';
import path from 'path';
import fs from 'fs';

// Deterministic shuffle using a seed
const seededShuffle = (array: string[], seed: number) => {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return array.sort((a, b) => random(seed++) - random(seed++));
};

const removeDuplicates = (array: string[]) => {
  return Array.from(new Set(array));
};

const HomePage = async () => {
  const videosDirectory = path.join(process.cwd(), 'public/Videos/videos_mkx_embedsub');

  let videoFiles: string[] = [];
  try {
    const files = fs.readdirSync(videosDirectory);
    videoFiles = files
      .filter((file) => file.endsWith('.mkv'))
      .map((file) => `/Videos/videos_mkx_embedsub/${encodeURIComponent(file)}`);

    videoFiles = removeDuplicates(videoFiles); // Remove duplicates
    videoFiles = seededShuffle(videoFiles, 42); // Deterministic shuffle with seed
  } catch (error) {
    console.error('Error reading video files:', error);
  }

  // Pass the deduplicated and shuffled videoFiles as a prop to the client component
  return (
    <div>
      <VideoPlayer videos={videoFiles} />
    </div>
  );
};

export default HomePage;