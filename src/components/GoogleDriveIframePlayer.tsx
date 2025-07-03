'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './GoogleDriveIframePlayer.module.css';

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
    const [debugInfo, setDebugInfo] = useState<any>(null); useEffect(() => { }, []);

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

            const params = new URLSearchParams();
            if (apiKey) params.append('apiKey', apiKey);
            if (folderId) params.append('folderId', folderId); const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/google-drive-videos-recursive?${params}`; const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorText = await response.text();
                const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);

                if (!fallbackResponse.ok) {
                    const errorData = await fallbackResponse.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'All API endpoints failed');
                } const data = await fallbackResponse.json();
                setVideos(data.videos || []);
                setDebugInfo(data.debug || null);
            } else {
                const data = await response.json();
                setDebugInfo(data.debug || null); if (data.videos?.length === 0) {
                    const fallbackResponse = await fetch(`${baseUrl}/api/google-drive-videos?${params}`);
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        setVideos(fallbackData.videos || []);
                    } else {
                        setVideos(data.videos || []);
                    }
                } else {
                    setVideos(data.videos || []);
                }
            }
        } catch (err) {
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
    }, [currentIndex]); const getEmbedUrl = useCallback((video: Video): string => {
        if (!video || !video.fileId) return '';
        return `https://drive.google.com/file/d/${video.fileId}/preview`;
    }, []);

    // Function to clean title by removing "TUYU" or "TUYU -" prefix
    const cleanTitle = useCallback((title: string | undefined): string => {
        if (!title) return '';
        return title.replace(/TUYU\s*-?\s*/g, '').trim();
    }, []);

    if (loading) {
        return (<div className={styles.loadingContainer} style={{
            padding: '80px 20px',
            color: '#333',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 240, 245, 0.5))',
            backdropFilter: 'blur(5px)',
            borderRadius: '15px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            maxWidth: '1600px',
            margin: '0 auto',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div className={styles.loader} style={{
                width: '50px',
                height: '50px',
                margin: '0 auto 30px auto',
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderLeftColor: '#3498db',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite'
            }}></div>
            <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '20px',
                color: '#3498db'
            }}>
                Loading videos from Google Drive
            </h3>
            <p style={{
                fontSize: '1.1rem',
                opacity: 0.8,
                maxWidth: '600px',
                margin: '0 auto 20px auto',
                color: '#333'
            }}>
                Please wait while we access your Google Drive content...
            </p>
            <p className={styles.debugText} style={{
                fontSize: '0.9rem',
                opacity: 0.6,
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                display: 'inline-block',
                color: '#333'
            }}>
                API Key: {apiKey ? "✓" : "✗"} | Folder ID: {folderId ? "✓" : "✗"}
            </p>
        </div>
        );
    }

    if (error) {
        return (<div className={styles.errorContainer} style={{
            padding: '60px 30px',
            textAlign: 'center',
            color: '#333',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 240, 245, 0.5))',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(231, 76, 60, 0.2)',
            borderRadius: '15px',
            margin: '20px auto',
            maxWidth: '1600px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 30px auto',
                borderRadius: '50%',
                background: 'rgba(231, 76, 60, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 10px rgba(231, 76, 60, 0.1)'
            }}>
                <span style={{ fontSize: '40px' }}>⚠️</span>
            </div>

            <h3 style={{
                color: '#e74c3c',
                marginBottom: '20px',
                fontSize: '1.8rem',
                fontWeight: '600'
            }}>
                Error Loading Videos
            </h3>

            <p style={{
                fontSize: '1.1rem',
                maxWidth: '800px',
                margin: '0 auto 30px auto',
                lineHeight: '1.6',
                background: 'rgba(231, 76, 60, 0.1)',
                padding: '15px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(231, 76, 60, 0.2)',
                color: '#333'
            }}>{error}</p>

            <div className={styles.debugInfo} style={{
                margin: '15px auto 30px auto',
                textAlign: 'left',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '15px',
                borderRadius: '10px',
                fontFamily: 'monospace',
                maxWidth: '800px',
                maxHeight: '200px',
                overflow: 'auto',
                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)',
                color: '#333'
            }}>
                <p style={{ color: '#3498db', marginBottom: '10px', fontSize: '14px' }}>Debug Information:</p>
                <pre style={{ margin: '5px 0', fontSize: '13px', color: '#333' }}>API Key: {apiKey ? "Provided" : "Missing"}</pre>
                <pre style={{ margin: '5px 0', fontSize: '13px', color: '#333' }}>Folder ID: {folderId ? "Provided" : "Missing"}</pre>
                <pre style={{ margin: '5px 0', fontSize: '13px', color: '#333' }}>API Key Length: {apiKey?.length || 0}</pre>
                <pre style={{ margin: '5px 0', fontSize: '13px', color: '#333' }}>Folder ID Length: {folderId?.length || 0}</pre>
                {debugInfo && (
                    <pre style={{
                        margin: '10px 0',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        background: 'rgba(255, 255, 255, 0.4)',
                        padding: '10px',
                        borderRadius: '5px',
                        color: '#333'
                    }}>
                        API Response Debug: {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button onClick={fetchVideos} style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.5)',
                    transition: 'all 0.3s ease'
                }}>Try Again</button>

                <button onClick={() => window.location.reload()} style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #3498db, #2980b9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.5)',
                    transition: 'all 0.3s ease'
                }}>Reload Page</button>
            </div>
        </div>
        );
    }

    if (filteredVideos.length === 0) {
        return (<div className={styles.noVideos} style={{
            padding: '60px 30px',
            textAlign: 'center',
            color: '#333',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 240, 245, 0.5))',
            backdropFilter: 'blur(5px)',
            borderRadius: '15px',
            margin: '20px auto',
            maxWidth: '1600px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 30px auto',
                borderRadius: '50%',
                background: 'rgba(52, 152, 219, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 10px rgba(52, 152, 219, 0.1)'
            }}>
                <span style={{ fontSize: '40px' }}>📂</span>
            </div>

            <h3 style={{
                marginBottom: '20px',
                fontSize: '1.8rem',
                fontWeight: '600',
                color: '#3498db'
            }}>
                No Videos Found
            </h3>

            <p style={{
                fontSize: '1.1rem',
                maxWidth: '600px',
                margin: '0 auto 15px auto',
                lineHeight: '1.6',
                color: '#333'
            }}>
                No videos were found in your Google Drive folder.
            </p>

            <p className={styles.smallText} style={{
                fontSize: '16px',
                opacity: 0.7,
                margin: '0 auto 30px auto',
                maxWidth: '700px',
                background: 'rgba(52, 152, 219, 0.1)',
                padding: '15px 20px',
                borderRadius: '10px',
                lineHeight: '1.6',
                color: '#333'
            }}>
                Make sure your Google Drive folder contains video files and the correct folder ID is provided.
                Video formats like MP4, WebM, and MKV are supported.
            </p>

            <button onClick={fetchVideos} style={{
                marginTop: '15px',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.5)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
            }}>
                <span style={{ fontSize: '18px' }}>🔄</span>
                Refresh
            </button>
        </div>
        );
    }

    const currentVideo = filteredVideos[currentIndex];
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < filteredVideos.length - 1;

    return (<div className={styles.googleDrivePlayer} style={{
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(240, 240, 245, 0.5))',
        backdropFilter: 'blur(5px)',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
    }}>
        <div className={styles.playerContainer} style={{ width: '100%' }}>                <div className={styles.playerWrapper} style={{
            position: 'relative',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px 10px 0 0',
            overflow: 'hidden',
            maxWidth: '1600px',
            margin: '0 auto'
        }}>
            {currentVideo && currentVideo.fileId ? (
                <iframe
                    src={getEmbedUrl(currentVideo)}
                    width="100%"
                    height="720px"
                    style={{
                        border: 'none',
                        borderRadius: '10px 10px 0 0',
                        aspectRatio: '16/9',
                        maxHeight: '80vh',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease'
                    }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={cleanTitle(currentVideo?.title) || "Video Player"}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '720px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.4)',
                    color: '#333',
                    borderRadius: '10px 10px 0 0',
                    aspectRatio: '16/9',
                    maxHeight: '80vh'
                }}>
                    <p>No video selected</p>
                </div>
            )}
        </div>                <div className={styles.videoControls} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            padding: '22px',
            background: 'linear-gradient(to bottom, rgba(240, 240, 245, 0.4), rgba(220, 220, 230, 0.5))',
            backdropFilter: 'blur(5px)',
            borderRadius: '0 0 10px 10px'
        }}>
                <button
                    onClick={playPrevious}
                    className={`${styles.controlButton} ${styles.prevButton}`}
                    disabled={!canGoPrevious}
                    style={{
                        padding: '12px 20px',
                        borderRadius: '30px',
                        background: canGoPrevious ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#a0a0a0',
                        color: 'white',
                        border: 'none',
                        cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: canGoPrevious ? '0 4px 12px rgba(52, 152, 219, 0.5)' : 'none',
                        opacity: canGoPrevious ? 1 : 0.6,
                    }}
                >
                    <span style={{ fontSize: '18px' }}>⏮️</span>
                    Previous
                </button>

                <button
                    onClick={playNext}
                    className={`${styles.controlButton} ${styles.nextButton}`}
                    disabled={!canGoNext}
                    style={{
                        padding: '12px 20px',
                        borderRadius: '30px',
                        background: canGoNext ? 'linear-gradient(135deg, #3498db, #2980b9)' : '#a0a0a0',
                        color: 'white',
                        border: 'none',
                        cursor: canGoNext ? 'pointer' : 'not-allowed',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: canGoNext ? '0 4px 12px rgba(52, 152, 219, 0.5)' : 'none',
                        opacity: canGoNext ? 1 : 0.6,
                    }}
                >
                    Next
                    <span style={{ fontSize: '18px' }}>⏭️</span>
                </button>
            </div>                <div className={styles.videoInfo} style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'linear-gradient(to bottom, rgba(240, 240, 245, 0.3), rgba(225, 225, 235, 0.4))',
                color: '#333',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <h3 className={styles.videoTitle} style={{
                    margin: '0 0 12px 0',
                    fontSize: '1.6rem',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    color: '#333'
                }}>
                    {cleanTitle(currentVideo?.title) || `Video ${currentIndex + 1}`}
                </h3>
                {currentVideo?.artist && (
                    <p className={styles.videoArtist} style={{
                        margin: '0 0 10px 0',
                        fontSize: '1.1rem',
                        opacity: 0.95,
                        color: '#3498db',
                        fontWeight: '500'
                    }}>
                        🎵 {currentVideo.artist}
                    </p>
                )}
                {currentVideo?.folder && (
                    <p className={styles.videoFolder} style={{
                        margin: '0',
                        fontSize: '0.95rem',
                        opacity: 0.8,
                        background: 'rgba(0, 0, 0, 0.05)',
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '15px',
                        color: '#333'
                    }}>
                        📁 {currentVideo.folder}
                    </p>
                )}
                <div style={{
                    marginTop: '15px',
                    fontSize: '0.95rem',
                    opacity: 0.8,
                    color: '#e74c3c',
                    fontWeight: '500'
                }}>
                    📋 Video {currentIndex + 1} of {filteredVideos.length}
                </div>
            </div>
        </div>

        <div className={styles.playlistContainer} style={{ marginTop: '20px' }}>                <div className={styles.playlistHeader} style={{
            padding: '24px 20px',
            background: 'linear-gradient(to bottom, rgba(240, 240, 245, 0.3), rgba(225, 225, 235, 0.4))',
            borderRadius: '10px 10px 0 0',
            marginBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>                    <h3 className={styles.playlistTitle} style={{
            margin: '0 0 20px 0',
            fontSize: '1.4rem',
            textAlign: 'center',
            color: '#333',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
                <span style={{ marginRight: '8px', fontSize: '1.5rem' }}>🎵</span>
                Videos ({filteredVideos.length})
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
                            padding: '14px 24px',
                            borderRadius: '30px',
                            border: '2px solid rgba(52, 152, 219, 0.3)',
                            background: 'rgba(255, 255, 255, 0.4)',
                            color: '#333',
                            fontSize: '15px',
                            outline: 'none',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease'
                        }}
                    />
                </div>
            )}
        </div>                <div className={styles.playlistItems} style={{
            maxHeight: '500px',
            overflowY: 'auto',
            paddingBottom: '15px',
            borderRadius: '0 0 10px 10px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#3498db rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(5px)'
        }}>
                {filteredVideos.map((video, index) => {
                    const isActive = index === currentIndex;

                    return (
                        <div
                            key={index}
                            className={`${styles.playlistItem} ${isActive ? styles.active : ''}`}
                            onClick={() => setCurrentIndex(index)}
                            style={{
                                padding: '16px 20px',
                                margin: '5px 10px',
                                cursor: 'pointer',
                                borderRadius: '10px',
                                borderLeft: isActive ? '4px solid #e74c3c' : '4px solid transparent', background: isActive
                                    ? 'linear-gradient(to right, rgba(231, 76, 60, 0.15), rgba(231, 76, 60, 0.05))'
                                    : 'rgba(255, 255, 255, 0.15)',
                                transition: 'all 0.3s ease',
                                transform: isActive ? 'translateX(5px) scale(1.02)' : 'translateX(0) scale(1)',
                                boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
                            }}
                        >
                            <div className={styles.playlistItemContent}>
                                <div className={styles.playlistItemTitle} style={{
                                    fontWeight: isActive ? '700' : '500',
                                    fontSize: '16px',
                                    color: isActive ? '#e74c3c' : '#333',
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {isActive ? (
                                        <span style={{
                                            color: '#e74c3c',
                                            fontSize: '18px',
                                            animation: isActive ? 'pulse 1.5s infinite' : 'none'
                                        }}>▶️</span>
                                    ) : (
                                        <span style={{
                                            width: '18px',
                                            height: '18px',
                                            display: 'inline-block',
                                            border: '2px solid rgba(0, 0, 0, 0.2)',
                                            borderRadius: '50%',
                                            marginRight: '2px'
                                        }}></span>
                                    )}
                                    <span>{cleanTitle(video.title) || `Video ${index + 1}`}</span>
                                </div>
                                {video.artist && (
                                    <div className={styles.playlistItemArtist} style={{
                                        fontSize: '14px',
                                        opacity: 0.9,
                                        color: isActive ? 'rgba(231, 76, 60, 0.8)' : 'rgba(52, 152, 219, 0.8)',
                                        marginBottom: '4px',
                                        paddingLeft: '26px'
                                    }}>
                                        🎵 {video.artist}
                                    </div>
                                )}
                                {video.folder && (
                                    <div className={styles.playlistItemFolder} style={{
                                        fontSize: '12px',
                                        opacity: 0.7,
                                        color: '#333',
                                        paddingLeft: '26px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ fontSize: '10px' }}>📁</span> {video.folder}
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
