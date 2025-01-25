"use client";
import VideoPlayer from '../components/VideoPlayer';
import useSWR from 'swr'; // Named import for SWR v2.x

const fetcher = async (url: string) => fetch(url).then(res => res.json());

interface Video {
  name: string;
  url: string;
}

interface VideosResponse {
  videos: Video[];
}

const HomePage = () => {
  const { data, error } = useSWR<VideosResponse>('/api/videos', fetcher);

  if (error) return <div>Error loading videos</div>;
  if (!data) return <div>Loading...</div>;

  const videoFiles = data.videos.map((file) => file.url);

  return (
    <div>
      <VideoPlayer videos={videoFiles} />
    </div>
  );
};

export default HomePage;