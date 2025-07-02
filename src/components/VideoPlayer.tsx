'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStepForward, faRandom, faSyncAlt, faStepBackward, faClosedCaptioning, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoPlayer.module.css';
import Playlist from './Playlist';

interface VideoPlayerProps {
    videos: { video: string; subtitle: string }[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos }) => {
    const [playlist, setPlaylist] = useState<{ video: string; subtitle: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoop, setIsLoop] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); const [volume, setVolume] = useState(1);
    const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const presetVolumePercentage = 0.5; // Set the desired percentage (e.g., 50%)
    const [previousVolume, setPreviousVolume] = useState(1); // Track the previous video's volume

    useEffect(() => {
        setPlaylist(videos);
        setCurrentIndex(0);
    }, [videos]);    // Volume control - chỉ cần một useEffect để xử lý volume
    useEffect(() => {
        if (videoRef.current) {
            const adjustedVolume = Math.min(volume * presetVolumePercentage, 1);
            videoRef.current.volume = adjustedVolume;
            setPreviousVolume(adjustedVolume); // Lưu trữ giá trị volume để sử dụng khi chuyển video
        }
    }, [volume, presetVolumePercentage]);

    // Xử lý khi thay đổi video
    useEffect(() => {
        if (videoRef.current) {
            // Giữ âm lượng khi chuyển video
            const adjustedVolume = Math.min(volume * presetVolumePercentage, 1);
            videoRef.current.volume = adjustedVolume;

            // Tự động phát video mới
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(err => {
                    console.error("Could not autoplay video:", err);
                    setIsPlaying(false);
                });
        }
    }, [currentIndex, volume, presetVolumePercentage]);

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
    }; const handleEnded = () => {
        if (isLoop) {
            // Khởi động lại video hiện tại thay vì chỉ đặt lại currentIndex
            if (videoRef.current) {
                videoRef.current.currentTime = 0; // Đặt thời gian về đầu video
                videoRef.current.play()          // Phát lại video
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                        console.error("Could not loop video:", err);
                        setIsPlaying(false);
                    });
            }
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
    }; const handleTimeUpdate = () => {
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

    const handleSelectVideo = (index: number) => {
        setCurrentIndex(index);
        setIsPlaying(false); // Reset play state for the selected video
    };

    if (playlist.length === 0) {
        return <div>Loading videos...</div>;
    } const getDisplayName = (url: string) => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const nameWithoutExt = filename.replace(/\.(webm|mp4|mkv)$/i, '').replace(/_/g, "'");
        return decodeURIComponent(nameWithoutExt);
    };

    const formatTime = (timeInSeconds: number): string => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';

        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }; return (
        <div className={styles.videoPlayerContainer}>
            <div className={styles.mainContent}>
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
                </video>                <div className={styles.controls}>
                    <div className={styles.utilityGroup}>
                        <button onClick={toggleLoop} className={styles.button}>
                            <FontAwesomeIcon icon={faSyncAlt} color={isLoop ? 'blue' : 'white'} />
                        </button>
                        <button onClick={handleShuffle} className={styles.button}>
                            <FontAwesomeIcon icon={faRandom} />
                        </button>
                    </div>

                    <div className={styles.playbackGroup}>
                        <button onClick={handleBack} className={styles.button}>
                            <FontAwesomeIcon icon={faStepBackward} />
                        </button>
                        <button onClick={handlePlayPause} className={`${styles.button} ${styles.playButton}`}>
                            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                        </button>
                        <button onClick={handleNext} className={styles.button}>
                            <FontAwesomeIcon icon={faStepForward} />
                        </button>
                    </div>

                    <div className={styles.utilityGroup}>
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
                </div><div className={styles.progressContainer}>
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
            </div>
            <div className={styles.sidebar}>
                <Playlist
                    videos={playlist}
                    currentIndex={currentIndex}
                    onSelectVideo={handleSelectVideo}
                />
            </div>
        </div>
    );
};

export default VideoPlayer;