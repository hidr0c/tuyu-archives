'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './EnhancedGoogleDrivePlayer.module.css';

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

interface GoogleDriveIframePlayerProps {
    apiKey?: string;
    folderId?: string;
    enableSearch?: boolean;
}

const GoogleDriveIframePlayer: React.FC<GoogleDriveIframePlayerProps> = ({
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

    // Log component mount for debugging
    useEffect(() => {
        console.log('GoogleDriveIframePlayer component mounted', { apiKey: !!apiKey, folderId: !!folderId });
        return () => {
            console.log('GoogleDriveIframePlayer component unmounting');
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
    }, [currentIndex]);

    // Function to get the embed URL for Google Drive
    const getEmbedUrl = useCallback((video: Video): string => {
        if (!video || !video.fileId) return '';
        
        // Always use the preview URL format for maximum compatibility
        // This is the most reliable way to embed Google Drive videos
        return `https://drive.google.com/file/d/${video.fileId}/preview`;
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer} style={{
                padding: '60px 20px',
                color: 'white',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '10px'
            }}>
                <div className={styles.loader}></div>
                <p>Loading videos from Google Drive...</p>
                <p className={styles.debugText}>API Key: {apiKey ? "✓" : "✗"} | Folder ID: {folderId ? "✓" : "✗"}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer} style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'white',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '10px',
                margin: '20px 0'
            }}>
                <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>Error loading videos</h3>
                <p>{error}</p>
                <div className={styles.debugInfo} style={{
                    margin: '15px 0',
                    textAlign: 'left',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '10px',
                    borderRadius: '5px',
                    fontFamily: 'monospace'
                }}>
                    <p>Debug Info:</p>
                    <pre style={{ margin: '5px 0', fontSize: '12px' }}>API Key: {apiKey ? "Provided" : "Missing"}</pre>
                    <pre style={{ margin: '5px 0', fontSize: '12px' }}>Folder ID: {folderId ? "Provided" : "Missing"}</pre>
                    <pre style={{ margin: '5px 0', fontSize: '12px' }}>API Key Length: {apiKey?.length || 0}</pre>
                    <pre style={{ margin: '5px 0', fontSize: '12px' }}>Folder ID Length: {folderId?.length || 0}</pre>
                    {debugInfo && (
                        <pre style={{ margin: '5px 0', fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                            API Response Debug: {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={fetchVideos} style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}>Try Again</button>
                    <button onClick={() => window.location.reload()} style={{
                        marginTop: '15px',
                        padding: '10px 20px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}>Reload Page</button>
                </div>
            </div>
        );
    }

    if (filteredVideos.length === 0) {
        return (
            <div className={styles.noVideos} style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                margin: '20px 0'
            }}>
                <p>No videos found in Google Drive folder.</p>
                <p className={styles.smallText} style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    margin: '10px 0'
                }}>Make sure your Google Drive folder contains video files and the correct folder ID is provided.</p>
                <button onClick={fetchVideos} style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}>Refresh</button>
            </div>
        );
    }

    const currentVideo = filteredVideos[currentIndex];
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < filteredVideos.length - 1;

    return (
        <div className={styles.googleDrivePlayer}>
            <div className={styles.playerContainer}>
                <div className={styles.playerWrapper}>
                    {currentVideo && currentVideo.fileId ? (
                        <iframe
                            src={getEmbedUrl(currentVideo)}
                            width="100%"
                            height="480px"
                            style={{ border: 'none', borderRadius: '10px 10px 0 0' }}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={currentVideo?.title || "Google Drive Video"}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '480px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            borderRadius: '10px 10px 0 0'
                        }}>
                            <p>No video selected</p>
                        </div>
                    )}
                </div>

                <div className={styles.videoControls} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '20px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '0 0 10px 10px'
                }}>
                    <button
                        onClick={playPrevious}
                        className={styles.controlButton}
                        disabled={!canGoPrevious}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '25px',
                            background: canGoPrevious ? '#3498db' : '#7f8c8d',
                            color: 'white',
                            border: 'none',
                            cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>⏮️</span>
                        Previous
                    </button>

                    <button
                        onClick={playNext}
                        className={styles.controlButton}
                        disabled={!canGoNext}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '25px',
                            background: canGoNext ? '#3498db' : '#7f8c8d',
                            color: 'white',
                            border: 'none',
                            cursor: canGoNext ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        Next
                        <span style={{ fontSize: '16px' }}>⏭️</span>
                    </button>
                </div>

                <div className={styles.videoInfo} style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white'
                }}>
                    <h3 className={styles.videoTitle} style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>
                        {currentVideo?.title || `Video ${currentIndex + 1}`}
                    </h3>
                    {currentVideo?.artist && (
                        <p className={styles.videoArtist} style={{
                            margin: '0 0 6px 0',
                            fontSize: '1rem',
                            opacity: 0.9
                        }}>
                            🎵 {currentVideo.artist}
                        </p>
                    )}
                    {currentVideo?.folder && (
                        <p className={styles.videoFolder} style={{
                            margin: '0',
                            fontSize: '0.9em',
                            opacity: 0.7
                        }}>
                            📁 {currentVideo.folder}
                        </p>
                    )}
                    <div style={{
                        marginTop: '10px',
                        fontSize: '0.9em',
                        opacity: 0.8
                    }}>
                        📋 {currentIndex + 1} of {filteredVideos.length}
                    </div>
                </div>
            </div>

            <div className={styles.playlistContainer} style={{ marginTop: '20px' }}>
                <div className={styles.playlistHeader} style={{ padding: '20px' }}>
                    <h3 className={styles.playlistTitle} style={{
                        margin: '0 0 15px 0',
                        fontSize: '1.3rem',
                        textAlign: 'center',
                        color: 'white'
                    }}>
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
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    borderRadius: '25px',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.playlistItems} style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingBottom: '10px'
                }}>
                    {filteredVideos.map((video, index) => {
                        const isActive = index === currentIndex;

                        return (
                            <div
                                key={index}
                                className={`${styles.playlistItem} ${isActive ? styles.active : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                style={{
                                    padding: '15px 20px',
                                    cursor: 'pointer',
                                    borderLeft: isActive ? '4px solid #e74c3c' : '4px solid transparent',
                                    background: isActive ? 'rgba(231, 76, 60, 0.2)' : 'transparent',
                                    transition: 'all 0.3s ease',
                                    transform: isActive ? 'translateX(5px)' : 'translateX(0)'
                                }}
                            >
                                <div className={styles.playlistItemContent}>
                                    <div className={styles.playlistItemTitle} style={{
                                        fontWeight: isActive ? '600' : '500',
                                        fontSize: '16px',
                                        color: 'white',
                                        marginBottom: '4px'
                                    }}>
                                        {isActive && '▶️ '}
                                        {video.title || `Video ${index + 1}`}
                                    </div>
                                    {video.artist && (
                                        <div className={styles.playlistItemArtist} style={{
                                            fontSize: '14px',
                                            opacity: 0.8,
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            marginBottom: '2px'
                                        }}>
                                            🎵 {video.artist}
                                        </div>
                                    )}
                                    {video.folder && (
                                        <div className={styles.playlistItemFolder} style={{
                                            fontSize: '12px',
                                            opacity: 0.6,
                                            color: 'rgba(255, 255, 255, 0.6)'
                                        }}>
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

export default GoogleDriveIframePlayer;
