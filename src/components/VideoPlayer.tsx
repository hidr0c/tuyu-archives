'use client';

import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videos: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos }) => {
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoop, setIsLoop] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        setPlaylist(videos);
        setCurrentIndex(0);
    }, [videos]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
    };

    const handleBack = () => {
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    };

    const toggleLoop = () => {
        setIsLoop((prev) => !prev);
    };

    const handlePlayPause = () => {
        setIsPlaying((prev) => !prev);
    };

    const handleEnded = () => {
        if (isLoop) {
            setCurrentIndex((prev) => prev);
        } else {
            handleNext();
        }
    };

    if (playlist.length === 0) {
        return <div>Loading videos...</div>;
    }

    return (
        <div className={styles.videoPlayerContainer}>
            <div className={styles.playerWrapper}>
                <ReactPlayer
                    url={playlist[currentIndex]}
                    playing={isPlaying}
                    loop={isLoop}
                    volume={volume}
                    onEnded={handleEnded}
                    controls
                    width="100%"
                    height="100%"
                />
            </div>
            <div className={styles.controls}>
                <button className={styles.button} onClick={handleBack}>Back</button>
                <button className={styles.button} onClick={handlePlayPause}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button className={styles.button} onClick={handleNext}>Next</button>
                <button className={styles.button} onClick={toggleLoop}>
                    {isLoop ? 'Loop On' : 'Loop Off'}
                </button>
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
    );
};

export default VideoPlayer;