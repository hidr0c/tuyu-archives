import { useState, useEffect, useCallback } from "react";
import { GoogleDriveService } from "../services/googleDriveService";
import { GoogleDriveVideo, GoogleDriveConfig } from "../types/googleDrive";

interface UseGoogleDriveOptions {
  config: GoogleDriveConfig;
  autoLoad?: boolean;
}

interface UseGoogleDriveReturn {
  videos: GoogleDriveVideo[];
  loading: boolean;
  error: string | null;
  loadVideos: () => Promise<void>;
  searchVideos: (query: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useGoogleDrive = ({
  config,
  autoLoad = true,
}: UseGoogleDriveOptions): UseGoogleDriveReturn => {
  const [videos, setVideos] = useState<GoogleDriveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveService] = useState(() => new GoogleDriveService(config));

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const videosWithSubtitles = await driveService.getVideosWithSubtitles();
      setVideos(videosWithSubtitles);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load videos from Google Drive";
      setError(errorMessage);
      console.error("Error loading videos:", err);
    } finally {
      setLoading(false);
    }
  }, [driveService]);

  const searchVideos = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadVideos();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await driveService.searchFiles(query);
        const videoFiles = searchResults.filter(
          (file) => driveService["isVideoFile"](file) // Access private method for search
        );

        // Create GoogleDriveVideo objects from search results
        const searchedVideos: GoogleDriveVideo[] = videoFiles.map((video) => ({
          video,
          title: driveService["extractTitle"](video.name),
          artist: driveService["extractArtist"](video.name),
        }));

        setVideos(searchedVideos);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search videos";
        setError(errorMessage);
        console.error("Error searching videos:", err);
      } finally {
        setLoading(false);
      }
    },
    [driveService, loadVideos]
  );

  const refresh = useCallback(async () => {
    await loadVideos();
  }, [loadVideos]);

  // Auto-load videos on mount
  useEffect(() => {
    if (autoLoad && config.apiKey) {
      loadVideos();
    }
  }, [autoLoad, config.apiKey, loadVideos]);

  return {
    videos,
    loading,
    error,
    loadVideos,
    searchVideos,
    refresh,
  };
};
