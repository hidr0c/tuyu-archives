// src/app/page.tsx
import VideoPlayer from '../components/VideoPlayer';
import path from 'path';
import fs from 'fs';

const HomePage = async () => {
  const videosDirectory = path.join(process.cwd(), 'public/Videos/videosxd'); // Updated directory path

  let videoFiles: { video: string; subtitle: string }[] = [];
  try {
    const files = fs.readdirSync(videosDirectory);
    videoFiles = files
      .filter((file) => file.endsWith('.webm'))
      .map((file) => ({
        video: `/Videos/videosxd/${encodeURIComponent(file)}`,
        subtitle: `/Videos/videosxd/${encodeURIComponent(file.replace('.webm', '.vtt'))}`,
      }));
  } catch (error) {
    console.error('Error reading video files:', error);
  }

  return (
    <div>
      <VideoPlayer videos={videoFiles} />
    </div>
  );
};

export default HomePage;