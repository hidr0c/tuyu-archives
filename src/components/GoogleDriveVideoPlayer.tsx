'use client';

import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import styles from './GoogleDriveVideoPlayer.module.css';

interface VideoData {
  video: string;
  subtitle: string;
  title: string;
  artist?: string;
  folder: string;
}

interface GoogleDriveVideoPlayerProps {
  apiKey?: string;
  folderId?: string;
  enableSearch?: boolean;
  enableFolderFilter?: boolean;
}

const GoogleDriveVideoPlayer: React.FC<GoogleDriveVideoPlayerProps> = ({ 
  apiKey: propApiKey, 
  folderId: propFolderId,
  enableSearch = true,
  enableFolderFilter = true
}) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>([]);

  // Get API key from props or environment variable
  const apiKey = propApiKey || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  const folderId = propFolderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;

  useEffect(() => {
    const fetchVideos = async () => {
      if (!apiKey) {
        setError('Google Drive API key is required');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (apiKey && !process.env.GOOGLE_DRIVE_API_KEY) {
          params.append('apiKey', apiKey);
        }
        if (folderId && !process.env.GOOGLE_DRIVE_FOLDER_ID) {
          params.append('folderId', folderId);
        }

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/google-drive-videos${queryString}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch videos');
        }
        
        const data = await response.json();
        setVideos(data.videos);
        setFilteredVideos(data.videos);
          // Extract unique folders for filter
        const uniqueFolders = [...new Set(data.videos.map((v: VideoData) => v.folder))].filter(Boolean) as string[];
        setFolders(uniqueFolders);
        
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [apiKey, folderId]);

  // Filter videos based on search query and selected folder
  useEffect(() => {
    let filtered = videos;
    
    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(video => video.folder === selectedFolder);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const lowerCaseSearch = searchQuery.toLowerCase();
      filtered = filtered.filter(video => {
        const title = video.title.toLowerCase();
        const artist = video.artist?.toLowerCase() || '';
        const folder = video.folder.toLowerCase();
        return title.includes(lowerCaseSearch) || 
               artist.includes(lowerCaseSearch) || 
               folder.includes(lowerCaseSearch);
      });
    }

    setFilteredVideos(filtered);
  }, [searchQuery, selectedFolder, videos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by useEffect
  };

  const handleRefresh = async () => {
    setSearchQuery('');
    setSelectedFolder('all');
    // Re-fetch videos
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (apiKey && !process.env.GOOGLE_DRIVE_API_KEY) {
        params.append('apiKey', apiKey);
      }
      if (folderId && !process.env.GOOGLE_DRIVE_FOLDER_ID) {
        params.append('folderId', folderId);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/google-drive-videos${queryString}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(data.videos);
      setFilteredVideos(data.videos);
        const uniqueFolders = [...new Set(data.videos.map((v: VideoData) => v.folder))].filter(Boolean) as string[];
      setFolders(uniqueFolders);
      
    } catch (err) {
      console.error('Error refreshing videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh videos');
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className={styles.errorContainer}>
        <h2>Google Drive API Key Required</h2>
        <p>Please provide a valid Google Drive API key to load videos.</p>
        <div className={styles.setupInstructions}>
          <h3>Setup Instructions:</h3>
          <ol>
            <li>Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the Google Drive API</li>
            <li>Create credentials (API key)</li>
            <li>Add your domain to the API key restrictions</li>
          </ol>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Videos</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h2>Loading videos from Google Drive...</h2>
        <p>This may take a moment depending on your folder size.</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>No Videos Found</h2>
        <p>No compatible video files found in the specified Google Drive folder.</p>
        <p>Supported formats: .webm, .mp4, .mkv</p>
        <button onClick={handleRefresh} className={styles.refreshButton}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.controlsContainer}>
        {enableFolderFilter && folders.length > 1 && (
          <div className={styles.filterContainer}>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className={styles.folderSelect}
            >
              <option value="all">All Folders ({videos.length} videos)</option>
              {folders.map(folder => {
                const count = videos.filter(v => v.folder === folder).length;
                return (
                  <option key={folder} value={folder}>
                    {folder} ({count} videos)
                  </option>
                );
              })}
            </select>
          </div>
        )}
        
        {enableSearch && (
          <div className={styles.searchContainer}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
              <button type="button" onClick={handleRefresh} className={styles.clearButton}>
                Clear
              </button>
            </form>
            <div className={styles.statsContainer}>
              <span className={styles.videoCount}>
                {filteredVideos.length} of {videos.length} videos shown
              </span>
              <button onClick={handleRefresh} className={styles.refreshButton}>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
      
      {filteredVideos.length > 0 ? (
        <VideoPlayer videos={filteredVideos} />
      ) : (
        <div className={styles.noResultsContainer}>
          <p>No videos match your search criteria.</p>
          <button onClick={() => { setSearchQuery(''); setSelectedFolder('all'); }} className={styles.clearButton}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveVideoPlayer;
