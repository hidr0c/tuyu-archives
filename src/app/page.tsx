// src/app/page.tsx
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import path from 'path';
import fs from 'fs';

const HomePage = async () => {
  const videosDirectory = path.join(process.cwd(), 'public/Videos/videosxd');

  let videoFiles: { video: string; subtitle: string; title?: string; artist?: string; folder: string }[] = [];
  try {
    const files = fs.readdirSync(videosDirectory);
    videoFiles = files
      .filter((file) => file.endsWith('.webm'))
      .map((file) => {
        // Parse title and artist from filename
        const nameWithoutExt = file.replace('.webm', '').replace(/_/g, ' ');
        const parts = nameWithoutExt.split(' - ');

        let title = nameWithoutExt;
        let artist = undefined;

        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        return {
          video: `/Videos/videosxd/${encodeURIComponent(file)}`,
          subtitle: `/Videos/videosxd/${encodeURIComponent(file.replace('.webm', '.vtt'))}`,
          title,
          artist,
          folder: 'Local Videos'
        };
      });
  } catch (error) {
    console.error('Error reading video files:', error);
  }

  return (
    <div>
      <ModernVideoPlayer videos={videoFiles} />
    </div>
  );
};

export default HomePage;