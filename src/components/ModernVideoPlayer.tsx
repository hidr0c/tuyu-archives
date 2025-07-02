'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faPause,
    faStepForward,
    faStepBackward,
    faRandom,
    faSyncAlt,
    faClosedCaptioning,
    faVolumeUp,
    faVolumeMute,
    faExpand,
    faCompress,
    faSearch
} from '@fortawesome/free-solid-svg-icons';
import styles from './ModernVideoPlayer.module.css';

interface Video {
    video: string;
    subtitle: string;
    title?: string;
    artist?: string;
    folder?: string;
}

interface ModernVideoPlayerProps {
    videos: Video[];
    showPlaylist?: boolean;
}

const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
    videos,
    showPlaylist = true
}) => {
    const [playlist, setPlaylist] = useState<Video[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

    // Progress and time states
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('all');

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize playlist
    useEffect(() => {
        setPlaylist(videos);
        setCurrentIndex(0);
    }, [videos]);

    // Auto-hide controls
    useEffect(() => {
        if (controlsTimeout) {
            clearTimeout(controlsTimeout);
        }

        if (isPlaying && isFullscreen) {
            const timeout = setTimeout(() => {
                setShowControls(false);
            }, 3000);
            setControlsTimeout(timeout);
        } else {
            setShowControls(true);
        }

        return () => {
            if (controlsTimeout) {
                clearTimeout(controlsTimeout);
            }
        };
    }, [isPlaying, isFullscreen]);

    // Volume and video change handling
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted, currentIndex]);

    // Auto-play next video after change
    useEffect(() => {
        if (videoRef.current && playlist.length > 0) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(err => {
                        console.error("Could not autoplay video:", err);
                        setIsPlaying(false);
                    });
            }
        }
    }, [currentIndex]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleNext = () => {
        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * playlist.length);
            setCurrentIndex(randomIndex);
        } else {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
        }
    };

    const handlePrevious = () => {
        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * playlist.length);
            setCurrentIndex(randomIndex);
        } else {
            setCurrentIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
        }
    };

    const handleShuffle = () => {
        setIsShuffle(!isShuffle);
        if (!isShuffle) {
            const shuffled = [...playlist].sort(() => Math.random() - 0.5);
            setPlaylist(shuffled);
            setCurrentIndex(0);
        }
    };

    const toggleLoop = () => {
        setIsLoop(!isLoop);
    };

    const handleEnded = () => {
        if (isLoop) {
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
            }
        } else {
            handleNext();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            setCurrentTime(currentTime);
            setDuration(duration);
            setProgress((currentTime / duration) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const toggleSubtitles = () => {
        setIsSubtitleEnabled(!isSubtitleEnabled);
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = isSubtitleEnabled ? 'disabled' : 'showing';
            }
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
    };

    const handleSelectVideo = (index: number) => {
        setCurrentIndex(index);
    };

    const formatTime = (timeInSeconds: number): string => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getDisplayName = (video: Video) => {
        if (video.title && video.artist) {
            return `${video.title} - ${video.artist}`;
        }

        const parts = video.video.split('/');
        const filename = parts[parts.length - 1];
        const nameWithoutExt = filename.replace(/\.(webm|mp4|mkv)$/i, '').replace(/_/g, ' ');
        return decodeURIComponent(nameWithoutExt);
    };

    // Filter videos based on search and folder
    const filteredVideos = playlist.filter(video => {
        const matchesSearch = getDisplayName(video).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFolder = selectedFolder === 'all' || video.folder === selectedFolder;
        return matchesSearch && matchesFolder;
    });

    // Get unique folders for filter
    const folders = Array.from(new Set(playlist.map(video => video.folder).filter(Boolean)));

    if (playlist.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loading}>Loading videos...</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`${styles.modernVideoPlayer} ${isFullscreen ? styles.fullscreen : ''}`}
            onMouseMove={handleMouseMove}
        >
            <div className={styles.videoContainer}>
                <video
                    ref={videoRef}
                    className={styles.video}
                    key={playlist[currentIndex]?.video}
                    onEnded={handleEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={handlePlayPause}
                >
                    <source src={playlist[currentIndex]?.video} type="video/webm" />
                    {playlist[currentIndex]?.subtitle && (
                        <track
                            src={playlist[currentIndex].subtitle}
                            kind="subtitles"
                            srcLang="en"
                            label="English"
                            default
                        />
                    )}
                    Your browser does not support the video tag.
                </video>

                {/* Video Title Overlay */}
                <div className={`${styles.titleOverlay} ${showControls ? styles.visible : ''}`}>
                    <h2 className={styles.videoTitle}>
                        {getDisplayName(playlist[currentIndex])}
                    </h2>
                </div>

                {/* Controls */}
                <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
                    {/* Progress Bar */}
                    <div className={styles.progressContainer}>
                        <span className={styles.timeDisplay}>
                            {formatTime(currentTime)}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={progress}
                            onChange={handleSeek}
                            className={styles.progressBar}
                        />
                        <span className={styles.timeDisplay}>
                            {formatTime(duration)}
                        </span>
                    </div>

                    {/* Control Buttons */}
                    <div className={styles.controlsRow}>
                        <div className={styles.leftControls}>
                            <button onClick={handlePrevious} className={styles.controlButton}>
                                <FontAwesomeIcon icon={faStepBackward} />
                            </button>
                            <button onClick={handlePlayPause} className={`${styles.controlButton} ${styles.playButton}`}>
                                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                            </button>
                            <button onClick={handleNext} className={styles.controlButton}>
                                <FontAwesomeIcon icon={faStepForward} />
                            </button>
                        </div>

                        <div className={styles.centerControls}>
                            <button
                                onClick={toggleLoop}
                                className={`${styles.controlButton} ${isLoop ? styles.active : ''}`}
                            >
                                <FontAwesomeIcon icon={faSyncAlt} />
                            </button>
                            <button
                                onClick={handleShuffle}
                                className={`${styles.controlButton} ${isShuffle ? styles.active : ''}`}
                            >
                                <FontAwesomeIcon icon={faRandom} />
                            </button>
                            <button
                                onClick={toggleSubtitles}
                                className={`${styles.controlButton} ${isSubtitleEnabled ? styles.active : ''}`}
                            >
                                <FontAwesomeIcon icon={faClosedCaptioning} />
                            </button>
                        </div>

                        <div className={styles.rightControls}>
                            <div className={styles.volumeControl}>
                                <button onClick={toggleMute} className={styles.controlButton}>
                                    <FontAwesomeIcon icon={isMuted || volume === 0 ? faVolumeMute : faVolumeUp} />
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className={styles.volumeSlider}
                                />
                            </div>
                            <button onClick={toggleFullscreen} className={styles.controlButton}>
                                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlist Sidebar */}
            {showPlaylist && !isFullscreen && (
                <div className={styles.playlist}>
                    <div className={styles.playlistHeader}>
                        <h3 className={styles.playlistTitle}>Playlist</h3>

                        {/* Search */}
                        <div className={styles.searchContainer}>
                            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search videos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>

                        {/* Folder Filter */}
                        {folders.length > 0 && (
                            <select
                                value={selectedFolder}
                                onChange={(e) => setSelectedFolder(e.target.value)}
                                className={styles.folderSelect}
                            >
                                <option value="all">All Folders</option>
                                {folders.map(folder => (
                                    <option key={folder} value={folder}>{folder}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className={styles.playlistContent}>
                        {filteredVideos.length === 0 ? (
                            <div className={styles.emptyPlaylist}>
                                No videos found
                            </div>
                        ) : (
                            filteredVideos.map((video, index) => {
                                const originalIndex = playlist.findIndex(v => v === video);
                                return (
                                    <div
                                        key={originalIndex}
                                        className={`${styles.playlistItem} ${originalIndex === currentIndex ? styles.active : ''}`}
                                        onClick={() => handleSelectVideo(originalIndex)}
                                    >
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemTitle}>
                                                {getDisplayName(video)}
                                            </div>
                                            {video.folder && (
                                                <div className={styles.itemFolder}>
                                                    {video.folder}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernVideoPlayer;
