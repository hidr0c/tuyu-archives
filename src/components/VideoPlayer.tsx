'use client';

import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    videos: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos }) => {
    const [playlist, setPlaylist] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoop, setIsLoop] = useState(false);

    useEffect(() => {
        shufflePlaylist(videos);
    }, [videos]);

    const shufflePlaylist = (videosList: string[]) => {
        const shuffled = [...videosList].sort(() => Math.random() - 0.5);
        setPlaylist(shuffled);
        setCurrentIndex(0);
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    };

    const handleShuffle = () => {
        shufflePlaylist(playlist);
    };

    const toggleLoop = () => {
        setIsLoop((prev) => !prev);
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
                    url={playlist[currentIndex]}
                    playing
                    controls
                    onEnded={handleEnded}
                    width="100%"
                    height="100%"
                />
            </div>
            <div className={styles.controls}>
                <button onClick={handleNext} className={styles.button}>
                    Next
                </button>
                <button onClick={toggleLoop} className={styles.button}>
                    {isLoop ? 'Disable Loop' : 'Enable Loop'}
                </button>
                <button onClick={handleShuffle} className={styles.button}>
                    Shuffle
                </button>
            </div>
            // I will cook this later xd
            <div className={styles.playlistInfo}>
                Now Playing: {playlist[currentIndex].split('/').pop()?.replace('.mkv', '')}
            </div>
        </div>
    );
};

export default VideoPlayer;