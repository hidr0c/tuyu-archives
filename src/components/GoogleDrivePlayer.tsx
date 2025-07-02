'use client';

import React, { useState, useEffect } from 'react';
import ModernVideoPlayer from './ModernVideoPlayer';
import styles from './GoogleDrivePlayer.module.css';

interface Video {
    video: string;
    subtitle: string;
    title?: string;
    artist?: string;
    folder: string;
}

interface GoogleDrivePlayerProps {
    apiKey?: string;
    folderId?: string;
    enableSearch?: boolean;
}

const GoogleDrivePlayer: React.FC<GoogleDrivePlayerProps> = ({
    apiKey,
    folderId,
    enableSearch = true
}) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [folders, setFolders] = useState<string[]>([]); useEffect(() => {
        fetchVideos();
    }, [apiKey, folderId]);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check if API key and folder ID are provided
            if (!apiKey || !folderId) {
                console.error('Missing API key or folder ID');
                setError('Missing Google Drive API configuration. Please check your .env.local file.');
                setLoading(false);
                return;
            }

            console.log('Fetching videos with API key and folder ID:', {
                apiKey: apiKey?.substring(0, 5) + '...',
                folderId: folderId
            });

            const params = new URLSearchParams();
            if (apiKey) params.append('apiKey', apiKey);
            if (folderId) params.append('folderId', folderId);

            const response = await fetch(`/api/google-drive-videos?${params}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch videos');
            }

            const data = await response.json();
            console.log('Fetched videos:', data.videos?.length || 0);
            setVideos(data.videos || []);
            setFolders(data.folders || []);
        } catch (err) {
            console.error('Error fetching videos:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        fetchVideos();
    };

    if (loading) {
        return (
            <div className={styles.statusContainer}>
                <div className={styles.statusContent}>
                    <div className={styles.spinner}></div>
                    <h2 className={styles.statusTitle}>Loading Videos</h2>
                    <p className={styles.statusMessage}>
                        Fetching videos from Google Drive...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.statusContainer}>
                <div className={styles.statusContent}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.statusTitle}>Error</h2>
                    <p className={styles.statusMessage}>{error}</p>
                    <button onClick={handleRetry} className={styles.retryButton}>
                        Try Again
                    </button>                    <div className={styles.helpText}>
                        <h3>Setup Instructions:</h3>
                        <ol>
                            <li>Create a Google Cloud Project</li>
                            <li>Enable the Google Drive API</li>
                            <li>Create an API key</li>
                            <li>Create a .env.local file in the project root</li>
                            <li>Add the following to your .env.local file:</li>
                            <li style={{ color: '#00ddff' }}>NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_api_key</li>
                            <li style={{ color: '#00ddff' }}>NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=your_folder_id</li>
                            <li style={{ color: '#00ddff' }}>GOOGLE_DRIVE_API_KEY=same_api_key</li>
                            <li style={{ color: '#00ddff' }}>GOOGLE_DRIVE_FOLDER_ID=same_folder_id</li>
                            <li>Restart the development server with npm run dev</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className={styles.statusContainer}>
                <div className={styles.statusContent}>
                    <div className={styles.emptyIcon}>📁</div>
                    <h2 className={styles.statusTitle}>No Videos Found</h2>
                    <p className={styles.statusMessage}>
                        No videos were found in the specified Google Drive folder.
                    </p>
                    <button onClick={handleRetry} className={styles.retryButton}>
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.googleDrivePlayer}>
            <div className={styles.header}>
                <h1 className={styles.title}>TUYU Archives</h1>
                <div className={styles.stats}>
                    <span className={styles.stat}>
                        {videos.length} videos
                    </span>
                    <span className={styles.stat}>
                        {folders.length} folders
                    </span>
                </div>
            </div>

            <ModernVideoPlayer
                videos={videos}
                showPlaylist={true}
            />
        </div>
    );
};

export default GoogleDrivePlayer;
