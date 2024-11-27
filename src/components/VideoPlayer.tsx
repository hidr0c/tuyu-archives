'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepForward, faRandom, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videos: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos }) => {
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoop, setIsLoop] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const playerRef = useRef<ReactPlayer>(null);

    useEffect(() => {
        setPlaylist(videos); // Use shuffled videos from props
        setCurrentIndex(0);
    }, [videos]);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    };

    const handleShuffle = () => {
        const shuffled = [...playlist].sort(() => Math.random() - 0.5);
        setPlaylist(shuffled);
        setCurrentIndex(0);
    };

    const toggleLoop = () => {
        setIsLoop((prev) => !prev);
    };

    const handlePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };

    const handleEnded = () => {
        if (isLoop) {
            // Replay the current video
            setCurrentIndex((prevIndex) => prevIndex);
        } else {
            // Move to the next video
            handleNext();
        }
    };

    if (playlist.length === 0) {
        return <div>Loading videos...</div>;
    }

    const getDisplayName = (url: string) => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const nameWithoutExt = filename.replace('.mkv', '').replace('.mp4', '');
        return decodeURIComponent(nameWithoutExt);
    };

    return (
        <div className={styles.videoPlayerContainer}>
            <div className={styles.playerWrapper}>
                <ReactPlayer
                    ref={playerRef}
                    url={playlist[currentIndex]}
                    playing={isPlaying}
                    controls={false} // Disable default controls
                    onEnded={handleEnded}
                    width="100%"
                    height="100%"
                />
            </div>
            <div className={styles.controls}>
                <button onClick={handlePlayPause} className={styles.button}>
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
                <button onClick={handleNext} className={styles.button}>
                    <FontAwesomeIcon icon={faStepForward} />
                </button>
                <button onClick={toggleLoop} className={styles.button}>
                    <FontAwesomeIcon icon={faSyncAlt} color={isLoop ? 'blue' : 'black'} />
                </button>
                <button onClick={handleShuffle} className={styles.button}>
                    <FontAwesomeIcon icon={faRandom} />
                </button>
            </div>
            <div className={styles.playlistInfo}>
                Now Playing: {getDisplayName(playlist[currentIndex])}
            </div>
        </div>
    );
};

export default VideoPlayer;