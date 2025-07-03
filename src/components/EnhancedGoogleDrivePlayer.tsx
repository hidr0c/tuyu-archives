'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './EnhancedGoogleDrivePlayer.module.css';
import VideoJSPlayer from './VideoJSPlayer';
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

interface EnhancedGoogleDrivePlayerProps {
    apiKey?: string;
    folderId?: string;
    enableSearch?: boolean;
}

const EnhancedGoogleDrivePlayer: React.FC<EnhancedGoogleDrivePlayerProps> = ({
    apiKey,
    folderId,
    enableSearch = true
}) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');

    // Log component mount for debugging
    useEffect(() => {
        console.log('EnhancedGoogleDrivePlayer component mounted', { apiKey: !!apiKey, folderId: !!folderId });
        return () => {
            console.log('EnhancedGoogleDrivePlayer component unmounting');
        };
    }, []);

    useEffect(() => {
        if (!apiKey || !folderId) {
            console.error('Missing API key or folder ID');
            setError('Missing Google Drive API configuration. Please check your .env.local file.');
            setLoading(false);
            return;
        }
        console.log('API Key and Folder ID are available, fetching videos...');
        fetchVideos();
    }, [apiKey, folderId]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = videos.filter(video =>
                video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.folder?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredVideos(filtered);
        } else {
            setFilteredVideos(videos);
        }
        setCurrentIndex(0);
    }, [searchTerm, videos]);

    // Effect for updating video URL when current video changes
    useEffect(() => {
        if (filteredVideos.length > 0 && currentIndex < filteredVideos.length) {
            const currentVideo = filteredVideos[currentIndex];
            if (currentVideo && currentVideo.fileId) {
                // Always use the preview URL for Google Drive videos
                // This is the most reliable method since it uses Google's own player
                const embedUrl = getEmbedUrl(currentVideo);
                setVideoUrl(embedUrl);

                console.log(`Setting video source to: ${embedUrl}`);
                
                // Update player source if player already exists
                if (player && isPlayerReady) {
                    console.log(`Updating player with embed URL`);
                    
                    // For Google Drive preview URLs, we explicitly mark as text/html
                    // This signals VideoJSPlayer to use iframe mode
                    player.src({ 
                        src: embedUrl, 
                        type: 'text/html' 
                    });
                }
            }
        }
    }, [filteredVideos, currentIndex, player, isPlayerReady]);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            setDebugInfo(null);

            console.log('Fetching videos with API key and folder ID:', {
                apiKeyProvided: !!apiKey,
                apiKeyLength: apiKey?.length || 0,
                folderIdProvided: !!folderId,
                folderIdLength: folderId?.length || 0
            });

            const params = new URLSearchParams();
            if (apiKey) params.append('apiKey', apiKey);
            if (folderId) params.append('folderId', folderId);

            // Fetch with absolute URL to avoid path issues
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/google-drive-videos-recursive?${params}`;
            console.log('Calling recursive API endpoint:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Recursive API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Recursive API failed:', errorText);
                console.log('Trying fallback API instead...');

                const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);
                console.log('Fallback API response status:', fallbackResponse.status);

                if (!fallbackResponse.ok) {
                    const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'All API endpoints failed');
                }

                const data = await fallbackResponse.json();
                console.log('Fallback API response:', data);
                console.log(`Found ${data.videos?.length || 0} videos`);
                setVideos(data.videos || []);
                setDebugInfo(data.debug || null);
            } else {
                const data = await response.json();
                console.log('Recursive API success:', data);
                console.log(`Found ${data.videos?.length || 0} videos in ${data.folders?.length || 0} folders`);
                setDebugInfo(data.debug || null);

                if (data.videos?.length === 0) {
                    console.warn('No videos found in recursive search, trying standard API...');
                    const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        console.log(`Found ${fallbackData.videos?.length || 0} videos in standard search`);
                        setVideos(fallbackData.videos || []);
                    } else {
                        setVideos(data.videos || []);
                    }
                } else {
                    setVideos(data.videos || []);
                }
            }
        } catch (err) {
            console.error('Error fetching videos:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch videos');
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
    }, [currentIndex]);    // Get embed URL for Google Drive
    const getEmbedUrl = useCallback((video: Video): string => {
        if (!video || !video.fileId) return '';
        
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
            
            // If there's an error with direct URL, try switching to preview URL
            if (filteredVideos[currentIndex]?.fileId) {
                const embedUrl = `https://drive.google.com/file/d/${filteredVideos[currentIndex].fileId}/preview`;
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

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loader}></div>
                <p>Loading videos from Google Drive...</p>
                <p className={styles.debugText}>API Key: {apiKey ? "✓" : "✗"} | Folder ID: {folderId ? "✓" : "✗"}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h3>Error loading videos</h3>
                <p>{error}</p>
                <div className={styles.debugInfo}>
                    <p>Debug Info:</p>
                    <pre>API Key: {apiKey ? "Provided" : "Missing"}</pre>
                    <pre>Folder ID: {folderId ? "Provided" : "Missing"}</pre>
                    <pre>API Key Length: {apiKey?.length || 0}</pre>
                    <pre>Folder ID Length: {folderId?.length || 0}</pre>
                    {debugInfo && (
                        <pre className={styles.debugResponse}>
                            API Response Debug: {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    )}
                </div>
                <div className={styles.buttonContainer}>
                    <button onClick={fetchVideos} className={styles.retryButton}>
                        Try Again
                    </button>
                    <button onClick={() => window.location.reload()} className={styles.reloadButton}>
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    if (filteredVideos.length === 0) {
        return (
            <div className={styles.noVideos}>
                <p>No videos found in Google Drive folder.</p>
                <p className={styles.smallText}>
                    Make sure your Google Drive folder contains video files and the correct folder ID is provided.
                </p>
                <button onClick={fetchVideos} className={styles.refreshButton}>
                    Refresh
                </button>
            </div>
        );
    }

    const currentVideo = filteredVideos[currentIndex];
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < filteredVideos.length - 1;
    const videoTitle = currentVideo?.title || `Video ${currentIndex + 1}`;

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
                    </h3>
                    {currentVideo?.artist && (
                        <p className={styles.videoArtist}>
                            🎵 {currentVideo.artist}
                        </p>
                    )}
                    {currentVideo?.folder && (
                        <p className={styles.videoFolder}>
                            📁 {currentVideo.folder}
                        </p>
                    )}
                    <div className={styles.videoCounter}>
                        📋 {currentIndex + 1} of {filteredVideos.length}
                    </div>
                </div>
            </div>

            <div className={styles.playlistContainer}>
                <div className={styles.playlistHeader}>
                    <h3 className={styles.playlistTitle}>
                        🎵 Playlist ({filteredVideos.length} videos)
                    </h3>

                    {enableSearch && (
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="🔍 Search videos, artists, or folders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
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
                            >
                                <div className={styles.playlistItemContent}>
                                    <div className={styles.playlistItemTitle}>
                                        {isActive && '▶️ '}
                                        {video.title || `Video ${index + 1}`}
                                    </div>
                                    {video.artist && (
                                        <div className={styles.playlistItemArtist}>
                                            🎵 {video.artist}
                                        </div>
                                    )}
                                    {video.folder && (
                                        <div className={styles.playlistItemFolder}>
                                            📁 {video.folder}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EnhancedGoogleDrivePlayer;
