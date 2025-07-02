import React from 'react';
import styles from './Playlist.module.css';

interface Video {
    video: string;
    subtitle: string;
}

interface PlaylistProps {
    videos: Video[];
    currentIndex: number;
    onSelectVideo: (index: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ videos, currentIndex, onSelectVideo }) => {
    const getDisplayName = (url: string) => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const nameWithoutExt = filename.replace(/\.(webm|mp4|mkv)$/i, '').replace(/_/g, "'");
        return decodeURIComponent(nameWithoutExt);
    };

    const formatDuration = (duration: string = "00:00") => {
        // You can implement actual duration calculation here if needed
        return duration;
    };

    const extractArtist = (title: string) => {
        // Extract artist from title (assuming format "Artist - Song")
        const parts = title.split(' - ');
        return parts.length > 1 ? parts[0] : 'Unknown Artist';
    };

    const extractSongTitle = (title: string) => {
        // Extract song title from full title
        const parts = title.split(' - ');
        return parts.length > 1 ? parts.slice(1).join(' - ') : title;
    };

    return (
        <div className={styles.playlist}>
            <h3 className={styles.playlistTitle}>Playlist</h3>            <div className={styles.playlistHeader}>
                <span className={styles.headerTitle}>Title</span>
                <span className={styles.headerArtist}>Artist</span>
            </div>
            {videos.map((video, index) => {
                const fullTitle = getDisplayName(video.video);
                const artist = extractArtist(fullTitle);
                const songTitle = extractSongTitle(fullTitle);

                return (<div
                    key={index}
                    className={`${styles.songItem} ${index === currentIndex ? styles.active : ''}`}
                    onClick={() => onSelectVideo(index)}
                >
                    <span className={styles.songTitle}>{songTitle}</span>
                    <span className={styles.songArtist}>{artist}</span>
                </div>
                );
            })}
        </div>
    );
};

export default Playlist;