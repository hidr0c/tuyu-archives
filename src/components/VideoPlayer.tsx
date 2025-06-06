'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepForward, faRandom, faSyncAlt, faStepBackward, faClosedCaptioning, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videos: { video: string; subtitle: string }[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos }) => {
    const [playlist, setPlaylist] = useState<{ video: string; subtitle: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoop, setIsLoop] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(true);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const presetVolumePercentage = 0.5; // Set the desired percentage (e.g., 50%)
    const [previousVolume, setPreviousVolume] = useState(1); // Track the previous video's volume

    useEffect(() => {
        setPlaylist(videos);
        setCurrentIndex(0);
    }, [videos]);

    useEffect(() => {
        if (videoRef.current) {
            const adjustedVolume = Math.min(volume * presetVolumePercentage, 1);
            videoRef.current.volume = adjustedVolume;
        }
    }, [volume, currentIndex]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (videoRef.current) {
            const adjustedVolume = Math.min(previousVolume * presetVolumePercentage, 1);
            videoRef.current.volume = adjustedVolume;
            setPreviousVolume(adjustedVolume); // Update the previous volume for the next video
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
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
        setIsPlaying(false); // Reset play state for the next video
    };

    const handleBack = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
    };

    const handleShuffle = () => {
        const shuffled = [...playlist].sort(() => Math.random() - 0.5);
        setPlaylist(shuffled);
        setCurrentIndex(0);
    };

    const toggleLoop = () => {
        setIsLoop((prev) => !prev);
    };

    const handleEnded = () => {
        if (isLoop) {
            setCurrentIndex((prevIndex) => prevIndex);
        } else {
            handleNext();
        }
    };

    const handleToggleSubtitle = () => {
        setIsSubtitleEnabled((prev) => !prev);
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = isSubtitleEnabled ? 'disabled' : 'showing';
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            setProgress((currentTime / duration) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
        }
    };

    const handleSelectVideo = (index: number) => {
        setCurrentIndex(index);
        setIsPlaying(false); // Reset play state for the selected video
    };

    if (playlist.length === 0) {
        return <div>Loading videos...</div>;
    }

    const getDisplayName = (url: string) => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const nameWithoutExt = filename.replace(/\.(webm|mp4|mkv)$/i, '').replace(/_/g, ' ');
        return decodeURIComponent(nameWithoutExt);
    };

    return (
        <div className={styles.videoPlayerContainer}>
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Playlist</h3>
                <ul className={styles.playlist}>
                    {playlist.map((video, index) => (
                        <li
                            key={index}
                            className={`${styles.playlistItem} ${index === currentIndex ? styles.active : ''}`}
                            onClick={() => handleSelectVideo(index)}
                        >
                            {getDisplayName(video.video)}
                        </li>
                    ))}
                </ul>
            </div>
            <div className={styles.mainContent}>
                <div className={styles.title}>
                    <h1>{getDisplayName(playlist[currentIndex].video)}</h1>
                </div>
                <video
                    ref={videoRef}
                    className={styles.video}
                    key={playlist[currentIndex].video}
                    onEnded={handleEnded}
                    onTimeUpdate={handleTimeUpdate}
                >
                    <source src={playlist[currentIndex].video} type="video/webm" />
                    <track
                        src={playlist[currentIndex].subtitle}
                        kind="subtitles"
                        srcLang="en"
                        label="English"
                        default
                    />
                    Your browser does not support the video tag.
                </video>
                <div className={styles.controls}>
                    <button onClick={toggleLoop} className={styles.button}>
                        <FontAwesomeIcon icon={faSyncAlt} color={isLoop ? 'blue' : 'white'} />
                    </button>
                    <button onClick={handleBack} className={styles.button}>
                        <FontAwesomeIcon icon={faStepBackward} />
                    </button>
                    <button onClick={handlePlayPause} className={styles.button}>
                        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                    </button>
                    <button onClick={handleNext} className={styles.button}>
                        <FontAwesomeIcon icon={faStepForward} />
                    </button>
                    <button onClick={handleShuffle} className={styles.button}>
                        <FontAwesomeIcon icon={faRandom} />
                    </button>
                    <button onClick={handleToggleSubtitle} className={styles.button}>
                        <FontAwesomeIcon icon={faClosedCaptioning} color={isSubtitleEnabled ? 'blue' : 'white'} />
                    </button>
                    <div className={styles.volumeControl}>
                        <FontAwesomeIcon icon={volume > 0 ? faVolumeUp : faVolumeMute} />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className={styles.volumeSlider}
                        />
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleSeek}
                    className={styles.progressBar}
                />
            </div>
        </div>
    );
};

export default VideoPlayer;