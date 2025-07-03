'use client';

import React, { useState, useEffect } from 'react';
import GoogleDrivePlayer from '../../components/GoogleDrivePlayer';

export default function GoogleDrivePage() {
    const [apiKey, setApiKey] = useState<string>('');
    const [folderId, setFolderId] = useState<string>('');

    useEffect(() => {
        // Access environment variables after component mounts to avoid hydration mismatch
        setApiKey(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '');
        setFolderId(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '');
    }, []);

    return (
        <div style={{ 
            width: '100%', 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            minHeight: '100vh'
        }}>
            <h1 style={{ 
                textAlign: 'center', 
                color: 'white', 
                marginBottom: '20px',
                fontWeight: 700,
                fontSize: '2rem'
            }}>
                Google Drive Video Player
            </h1>
            
            <GoogleDrivePlayer
                apiKey={apiKey}
                folderId={folderId}
                enableSearch={true}
            />
        </div>
    );
}
