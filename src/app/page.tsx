'use client';

import React from 'react';
import EnhancedVideoPlayer from '../components/EnhancedVideoPlayer';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [localVideos, setLocalVideos] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [folderId, setFolderId] = useState('');

  useEffect(() => {
    // Load local videos first
    const loadLocalVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (response.ok) {
          const data = await response.json();
          setLocalVideos(data.videos || []);
        }
      } catch (error) {
        console.error('Error loading local videos:', error);
      }
    };

    // Fetch environment variables
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/debug');
        if (response.ok) {
          const data = await response.json();
          setApiKey(data.googleDriveApiKey || '');
          setFolderId(data.googleDriveFolderId || '');
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadLocalVideos();
    loadConfig();
  }, []);
  return (<div style={{
    width: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, rgba(200, 200, 210, 0.5), rgba(190, 190, 200, 0.5))',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '15px',
    minHeight: '100vh'
  }}>
    <h1 style={{
      textAlign: 'center',
      color: '#333',
      marginBottom: '30px',
      fontWeight: 800,
      fontSize: '2.5rem',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    }}>

    </h1>

    <EnhancedVideoPlayer
      initialVideos={localVideos}
      apiKey={apiKey}
      folderId={folderId}
      enableGoogleDrive={true}
      enableSearch={true}
    />
  </div>
  );
}