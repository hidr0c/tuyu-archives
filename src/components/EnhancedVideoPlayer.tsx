'use client';

import React, { useState, useEffect, useCallback } from 'react';
import VideoJSPlayer from './VideoJSPlayer';
import styles from './EnhancedVideoPlayer.module.css';
import Player from 'video.js/dist/types/player';

interface Video {
    video: string;
    videoEmbed?: string;
    videoDownload?: string;
    subtitle: string;
    title?: string;
    artist?: string;
    folder: string;
    fileId?: string;
}

interface EnhancedVideoPlayerProps {
    apiKey?: string;
    folderId?: string;
    initialVideos?: Video[];
    enableSearch?: boolean;
    enableGoogleDrive?: boolean;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
    apiKey,
    folderId,
    initialVideos = [],
    enableSearch = true,
    enableGoogleDrive = true
}) => {
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>(initialVideos);
    const [loading, setLoading] = useState(enableGoogleDrive);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [availableFolders, setAvailableFolders] = useState<string[]>([]);

    // Function to clean title by removing "TUYU" or "TUYU -" prefix
    const cleanTitle = useCallback((title: string | undefined): string => {
        if (!title) return '';
        return title.replace(/TUYU\s*-?\s*/g, '').trim();
    }, []);

    // Log component mount for debugging
    useEffect(() => {
        console.log('EnhancedVideoPlayer component mounted');
        return () => {
            console.log('EnhancedVideoPlayer component unmounting');
        };
    }, []);

    // Load Google Drive videos if enabled
    useEffect(() => {
        if (enableGoogleDrive && apiKey && folderId) {
            fetchGoogleDriveVideos();
        }
    }, [enableGoogleDrive, apiKey, folderId]);

    // Update filtered videos when search term changes or videos are loaded
    useEffect(() => {
        let filtered = [...videos];

        // Apply folder filter if any folders are selected
        if (selectedFolders.length > 0) {
            filtered = filtered.filter(video =>
                selectedFolders.includes(video.folder)
            );
        }

        // Apply search term filter
        if (searchTerm) {
            filtered = filtered.filter(video =>
                video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.folder?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredVideos(filtered);

        // Only reset current index if the filtered list changes significantly
        if (filtered.length > 0 && currentIndex >= filtered.length) {
            setCurrentIndex(0);
        }
    }, [searchTerm, videos, selectedFolders]);

    // Effect for updating video URL when current video changes
    useEffect(() => {
        if (filteredVideos.length > 0 && currentIndex < filteredVideos.length) {
            const currentVideo = filteredVideos[currentIndex];

            if (currentVideo) {
                // Determine the best URL to use
                let sourceUrl = currentVideo.video;
                let sourceType = 'video/mp4';

                // For Google Drive videos, use the embed URL with iframe
                if (currentVideo.fileId) {
                    sourceUrl = getEmbedUrl(currentVideo);
                    sourceType = 'text/html'; // Signal to VideoJSPlayer to use iframe
                }

                console.log(`Setting video source to: ${sourceUrl}`);
                setVideoUrl(sourceUrl);

                // Update player source if player already exists
                if (player && isPlayerReady) {
                    console.log(`Updating player with URL: ${sourceUrl}, type: ${sourceType}`);
                    player.src({
                        src: sourceUrl,
                        type: sourceType
                    });
                }
            }
        }
    }, [filteredVideos, currentIndex, player, isPlayerReady]);

    // Extract all available folders from videos
    useEffect(() => {
        const folders = Array.from(new Set(videos.map(v => v.folder)));
        setAvailableFolders(folders);
    }, [videos]);

    const fetchGoogleDriveVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            setDebugInfo(null);

            console.log('Fetching Google Drive videos');

            const params = new URLSearchParams();
            if (apiKey) params.append('apiKey', apiKey);
            if (folderId) params.append('folderId', folderId);

            // Fetch with absolute URL to avoid path issues
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/google-drive-videos-recursive?${params}`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Google Drive API failed:', errorText);

                // Try fallback API
                const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);

                if (!fallbackResponse.ok) {
                    const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'All API endpoints failed');
                }

                const data = await fallbackResponse.json();
                // Merge with existing videos
                setVideos(prev => [...prev, ...(data.videos || [])]);
                setDebugInfo(data.debug || null);
            } else {
                const data = await response.json();
                console.log(`Found ${data.videos?.length || 0} videos in Google Drive`);

                // Merge with existing videos
                setVideos(prev => [...prev, ...(data.videos || [])]);
                setDebugInfo(data.debug || null);
            }
        } catch (err) {
            console.error('Error fetching Google Drive videos:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch videos from Google Drive');
        } finally {
            setLoading(false);
        }
    };

    const playNext = useCallback(() => {
        if (filteredVideos.length === 0) return;

        const nextIndex = currentIndex + 1;
        if (nextIndex < filteredVideos.length) {
            setCurrentIndex(nextIndex);
        }
    }, [currentIndex, filteredVideos.length]);

    const playPrevious = useCallback(() => {
        if (filteredVideos.length === 0) return;

        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setCurrentIndex(prevIndex);
        }
    }, [currentIndex]);

    // Get embed URL for Google Drive
    const getEmbedUrl = useCallback((video: Video): string => {
        if (!video || !video.fileId) return video.video;

        // Always use the preview URL format for maximum compatibility
        return `https://drive.google.com/file/d/${video.fileId}/preview`;
    }, []);

    // Handle player ready event
    const handlePlayerReady = useCallback((player: Player) => {
        console.log('Video.js player or iframe wrapper is ready');
        setPlayer(player);
        setIsPlayerReady(true);

        // Add event listeners
        player.on('ended', () => {
            console.log('Video ended, playing next if available');
            playNext();
        });

        player.on('error', (e: unknown) => {
            console.error('Video.js player error:', e);

            // If there's an error with direct URL, try switching to preview URL for Google Drive videos
            const currentVideo = filteredVideos[currentIndex];
            if (currentVideo?.fileId) {
                const embedUrl = `https://drive.google.com/file/d/${currentVideo.fileId}/preview`;
                console.log(`Error with video playback. Switching to embed URL: ${embedUrl}`);

                // Set the new URL and let the effect handle updating the player
                setVideoUrl(embedUrl);

                // Since we're using iframe for Google Drive preview URLs, we need special handling
                player.src({
                    src: embedUrl,
                    type: 'text/html'
                });
            }
        });

        // Additional event logging for debugging
        ['play', 'pause', 'seeking', 'seeked', 'volumechange'].forEach(event => {
            player.on(event, () => console.log(`Video event: ${event}`));
        });
    }, [playNext, filteredVideos, currentIndex]);

    const toggleFolderFilter = (folder: string) => {
        setSelectedFolders(prev => {
            if (prev.includes(folder)) {
                return prev.filter(f => f !== folder);
            } else {
                return [...prev, folder];
            }
        });
    };

    if (loading && videos.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loader}></div>
                <p>Loading videos from Google Drive...</p>
            </div>
        );
    }

    if (error && videos.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <h3>Error loading videos</h3>
                <p>{error}</p>
                <div className={styles.buttonContainer}>
                    <button onClick={fetchGoogleDriveVideos} className={styles.retryButton}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (filteredVideos.length === 0) {
        return (
            <div className={styles.noVideos}>
                <p>No videos found.</p>
                {enableGoogleDrive && (
                    <button onClick={fetchGoogleDriveVideos} className={styles.refreshButton}>
                        Refresh Google Drive
                    </button>
                )}
            </div>
        );
    } const currentVideo = filteredVideos[currentIndex];
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < filteredVideos.length - 1;
    const videoTitle = cleanTitle(currentVideo?.title) || `Video ${currentIndex + 1}`;

    return (
        <div className={styles.enhancedGoogleDrivePlayer}>
            <div className={styles.playerContainer}>
                <div className={styles.playerWrapper}>
                    {videoUrl ? (
                        <VideoJSPlayer
                            src={videoUrl}
                            title={videoTitle}
                            controls={true}
                            fluid={true}
                            autoplay={false}
                            className={styles.videoPlayer}
                            onReady={handlePlayerReady}
                            type={videoUrl.includes('/preview') ? 'text/html' : 'video/mp4'}
                        />
                    ) : (
                        <div className={styles.noVideoSelected}>
                            <p>No video selected</p>
                        </div>
                    )}
                </div>

                <div className={styles.videoControls}>
                    <button
                        onClick={playPrevious}
                        className={`${styles.controlButton} ${!canGoPrevious ? styles.disabled : ''}`}
                        disabled={!canGoPrevious}
                    >
                        <span className={styles.controlIcon}>⏮️</span>
                        Previous
                    </button>

                    <button
                        onClick={playNext}
                        className={`${styles.controlButton} ${!canGoNext ? styles.disabled : ''}`}
                        disabled={!canGoNext}
                    >
                        Next
                        <span className={styles.controlIcon}>⏭️</span>
                    </button>
                </div>

                <div className={styles.videoInfo}>
                    <h3 className={styles.videoTitle}>
                        {videoTitle}
                    </h3>                    {currentVideo?.artist && (
                        <p className={styles.videoArtist}>
                            {currentVideo.artist}
                        </p>
                    )}{currentVideo?.folder && (
                        <p className={styles.videoFolder}>
                            {currentVideo.folder}
                        </p>
                    )}                    <div className={styles.videoCounter}>
                        {currentIndex + 1} of {filteredVideos.length}
                    </div>
                </div>
            </div>

            <div className={styles.playlistContainer}>
                <div className={styles.playlistHeader}>                    <h3 className={styles.playlistTitle}>
                    Playlist ({filteredVideos.length} videos)
                </h3>

                    {enableSearch && (
                        <div className={styles.searchContainer}>                            <input
                            type="text"
                            placeholder="Search videos, artists, or folders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        </div>
                    )}

                    {availableFolders.length > 1 && (
                        <div className={styles.folderFilter}>
                            <p>Filter by source:</p>
                            <div className={styles.folderButtons}>
                                {availableFolders.map(folder => (
                                    <button
                                        key={folder}
                                        onClick={() => toggleFolderFilter(folder)}
                                        className={`${styles.folderButton} ${selectedFolders.includes(folder) ? styles.folderButtonActive : ''}`}
                                    >
                                        {folder}
                                    </button>
                                ))}
                                {selectedFolders.length > 0 && (
                                    <button
                                        onClick={() => setSelectedFolders([])}
                                        className={styles.clearFiltersButton}
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.playlistItems}>
                    {filteredVideos.map((video, index) => {
                        const isActive = index === currentIndex;

                        return (
                            <div
                                key={index}
                                className={`${styles.playlistItem} ${isActive ? styles.active : ''}`}
                                onClick={() => setCurrentIndex(index)}
                            >                                <div className={styles.playlistItemContent}>                                    <div className={styles.playlistItemTitle}>
                                {cleanTitle(video.title) || `Video ${index + 1}`}
                            </div>{video.artist && (
                                <div className={styles.playlistItemArtist}>
                                    {video.artist}
                                </div>
                            )}{video.folder && (
                                <div className={styles.playlistItemFolder}>
                                    {video.folder}
                                </div>
                            )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <div className={styles.loadingMore}>
                        <div className={styles.miniLoader}></div>
                        <p>Loading more videos...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedVideoPlayer;
