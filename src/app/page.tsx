"use client"

import { useState, useEffect } from "react";
import VideoPlayer from "../app/components/VideoPlayer";

interface Video {
    id: string;
    name: string;
    webContentLink: string;
}

export default function Home() {
    const [videos, setVideos] = useState<Video[]>([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch("/api/drive-files");
                const data = await response.json();
                setVideos(data);
            } catch (error) {
                console.error("Error fetching videos:", error);
            }
        };

        fetchVideos();
    }, []);

    return (
        <div>
            <h1>Google Drive Playlist</h1>
            <VideoPlayer videos={videos} />
        </div>
    );
}
