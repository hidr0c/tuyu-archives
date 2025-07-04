'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    subtitleStatus?: string; // Added status field to track if subtitles are available
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
    enableSearch = false,
    enableGoogleDrive = true
}) => {
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>(initialVideos);
    const [loading, setLoading] = useState(enableGoogleDrive);
    const [error, setError] = useState<string | null>(null); const [currentIndex, setCurrentIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [availableFolders, setAvailableFolders] = useState<string[]>([]);

    // Track current video being played to maintain it during searches
    const currentVideoRef = useRef<Video | null>(null);
    // Store stable reference to current index to avoid unwanted updates
    const stableCurrentIndexRef = useRef<number>(currentIndex); const cleanTitle = useCallback((title: string | undefined): string => {
        if (!title) return '';
        return title.replace(/TUYU\s*-?\s*/g, '').trim();
    }, []);

    useEffect(() => {
        console.log('EnhancedVideoPlayer component mounted');
        return () => {
            console.log('EnhancedVideoPlayer component unmounting');
        };
    }, []); const normalizeText = useCallback((text: string): string => {
        if (!text) return '';
        try {
            // Normalize Vietnamese and other accented characters
            const normalized = text
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .toLowerCase()
                .trim();
            return normalized;
        } catch (error) {
            console.error('Error normalizing text:', error, 'Original text:', text);
            // Fallback: just convert to lowercase and trim
            try {
                return text.toLowerCase().trim();
            } catch (fallbackError) {
                console.error('Even fallback failed:', fallbackError);
                return '';
            }
        }
    }, []); useEffect(() => {
        if (enableGoogleDrive && apiKey && folderId) {
            fetchGoogleDriveVideos();
        }
    }, [enableGoogleDrive, apiKey, folderId]);    // Save the current playing video reference when currentIndex changes
    useEffect(() => {
        if (filteredVideos.length > 0 && currentIndex < filteredVideos.length) {
            currentVideoRef.current = filteredVideos[currentIndex];
            stableCurrentIndexRef.current = currentIndex;
        }
    }, [currentIndex, filteredVideos]);

    // Debug: Log currentIndex changes to help track unwanted video switches
    useEffect(() => {
        console.log(`Current index changed to: ${currentIndex}, video:`, filteredVideos[currentIndex]?.title || 'No video');
    }, [currentIndex, filteredVideos]);

    // Debounce search term to avoid filtering on each keystroke
    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Update filtered videos when debounced search term or filters change
    useEffect(() => {
        let filtered = [...videos];

        // Filter by folder
        if (selectedFolders.length > 0) {
            filtered = filtered.filter(video =>
                selectedFolders.includes(video.folder)
            );
        }

        // Filter by search term
        if (debouncedSearchTerm) {
            try {
                const normalizedSearchTerm = normalizeText(debouncedSearchTerm);

                filtered = filtered.filter(video => {
                    try {
                        return normalizeText(video.title || '').includes(normalizedSearchTerm) ||
                            normalizeText(video.artist || '').includes(normalizedSearchTerm) ||
                            normalizeText(video.folder || '').includes(normalizedSearchTerm);
                    } catch (err) {
                        console.error('Error filtering video:', err, video);
                        return false; // Skip videos that cause errors
                    }
                });
            } catch (err) {
                console.error('Error in search filtering:', err);
                // Keep the list as is if there's an error
            }
        }        // Update filtered videos list
        setFilteredVideos(filtered);

        // CRITICAL: Only update currentIndex when search is complete AND absolutely necessary
        if (!isSearching && filtered.length > 0) {
            // If there's a current video playing, try to maintain it at all costs
            if (currentVideoRef.current && filteredVideos.length > 0) {
                const currentPlayingVideo = filteredVideos[currentIndex];

                // Check if the current playing video is still in the filtered results
                const stillAvailableIndex = filtered.findIndex(v =>
                    v.video === currentPlayingVideo?.video ||
                    (v.title === currentPlayingVideo?.title && v.artist === currentPlayingVideo?.artist)
                );

                if (stillAvailableIndex !== -1) {
                    // Current video is still available, update index to its new position
                    if (stillAvailableIndex !== currentIndex) {
                        console.log(`Updating index from ${currentIndex} to ${stillAvailableIndex} to maintain current video`);
                        setCurrentIndex(stillAvailableIndex);
                    }
                } else {
                    // Current video was filtered out - DON'T automatically switch to index 0
                    // Keep the current index but note that video is not available
                    console.log('Current video filtered out, but keeping current index to avoid auto-switching');
                }
            } else if (currentVideoRef.current === null && filtered.length > 0 && currentIndex >= filtered.length) {
                // Only set to first video if no video is playing AND current index is out of bounds
                console.log('Setting to first video because no video is currently playing');
                setCurrentIndex(0);
            }
        }
    }, [debouncedSearchTerm, videos, selectedFolders, normalizeText, isSearching]);

    // Effect for updating video URL when current video changes
    useEffect(() => {
        if (filteredVideos.length > 0 && currentIndex < filteredVideos.length) {
            const currentVideo = filteredVideos[currentIndex]; if (currentVideo) {
                let sourceUrl = currentVideo.video;
                let sourceType = 'video/mp4';

                if (currentVideo.fileId) {
                    sourceUrl = getEmbedUrl(currentVideo);
                    sourceType = 'text/html';
                }

                console.log(`Setting video source to: ${sourceUrl}`);
                setVideoUrl(sourceUrl); if (player && isPlayerReady) {
                    console.log(`Updating player with URL: ${sourceUrl}, type: ${sourceType}`);
                    player.src({
                        src: sourceUrl,
                        type: sourceType
                    });
                }
            }
        }
    }, [filteredVideos, currentIndex, player, isPlayerReady]); useEffect(() => {
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
            if (folderId) params.append('folderId', folderId); const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/google-drive-videos-recursive?${params}`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Google Drive API failed:', errorText); const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);

                if (!fallbackResponse.ok) {
                    const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'All API endpoints failed');
                } const data = await fallbackResponse.json();
                setVideos(prev => [...prev, ...(data.videos || [])]);
                setDebugInfo(data.debug || null);
            } else {
                const data = await response.json();
                console.log(`Found ${data.videos?.length || 0} videos in Google Drive`); setVideos(prev => [...prev, ...(data.videos || [])]);
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
            console.error('Video.js player error:', e); const currentVideo = filteredVideos[currentIndex];
            if (currentVideo?.fileId) {
                const embedUrl = `https://drive.google.com/file/d/${currentVideo.fileId}/preview`;
                console.log(`Error with video playback. Switching to embed URL: ${embedUrl}`);

                setVideoUrl(embedUrl);

                player.src({
                    src: embedUrl,
                    type: 'text/html'
                });
            }
        });['play', 'pause', 'seeking', 'seeked', 'volumechange'].forEach(event => {
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

    // Debug effect to track currentIndex changes
    useEffect(() => {
        console.log('CurrentIndex changed to:', currentIndex, 'Filtered videos length:', filteredVideos.length);
        if (filteredVideos[currentIndex]) {
            console.log('Now playing:', filteredVideos[currentIndex].title);
        }
    }, [currentIndex, filteredVideos]);

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
                <div className={styles.playerWrapper}>                    {videoUrl ? (
                    <VideoJSPlayer src={videoUrl}
                        title={videoTitle}
                        controls={true}
                        fluid={true}
                        autoplay={false}
                        className={styles.videoPlayer}
                        onReady={handlePlayerReady}
                        type={videoUrl.includes('/preview') ? 'text/html' : 'video/webm'}
                        subtitle={currentVideo?.subtitle || ''}
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

                    {/* {enableSearch && (
                        <div className={styles.searchContainer}>                            <input
                            type="text"
                            placeholder="Search videos, artists, or folders..."
                            value={searchTerm}
                            onChange={(e) => {
                                try {
                                    const newValue = e.target.value;
                                    console.log('Search input changed to:', newValue);
                                    setSearchTerm(newValue);
                                } catch (error) {
                                    console.error('Error handling search input:', error);
                                }
                            }}
                            className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
                        />
                        </div>
                    )} */}

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
