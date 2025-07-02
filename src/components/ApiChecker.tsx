'use client';

import React, { useState, useEffect } from 'react';
import styles from '../components/GoogleDrivePlayer.module.css';

const ApiChecker: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkApiConfig();
    }, []);

    const checkApiConfig = async () => {
        try {
            setLoading(true);
            setError(null);

            const clientEnvStatus = {
                clientApiKeyConfigured: !!process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY,
                clientFolderIdConfigured: !!process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID,
                clientApiKeyValue: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY
                    ? `${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY.substring(0, 3)}...`
                    : null,
                clientFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || null
            };

            console.log('Client environment status:', clientEnvStatus);

            // Test server API configuration
            const response = await fetch('/api/test-google-drive');
            const data = await response.json();

            setResult({
                ...data,
                clientEnvStatus
            });
        } catch (err) {
            console.error('Error checking API config:', err);
            setError(err instanceof Error ? err.message : 'Failed to check API configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        checkApiConfig();
    };

    if (loading) {
        return (
            <div className={styles.statusContainer}>
                <div className={styles.statusContent}>
                    <div className={styles.spinner}></div>
                    <h2 className={styles.statusTitle}>Checking API Configuration</h2>
                    <p className={styles.statusMessage}>
                        Testing connection to Google Drive API...
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
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.statusContainer}>
            <div className={styles.statusContent} style={{ maxWidth: '800px' }}>
                <h2 className={styles.statusTitle}>
                    {result.success ? '✅ API Configuration OK' : '❌ API Configuration Error'}
                </h2>

                <div style={{ textAlign: 'left', marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    <h3 style={{ color: 'white', marginBottom: '10px' }}>Client Environment</h3>
                    <p style={{ color: result.clientEnvStatus.clientApiKeyConfigured ? '#4CAF50' : '#F44336', margin: '5px 0' }}>
                        NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY: {result.clientEnvStatus.clientApiKeyConfigured ? '✅ Configured' : '❌ Missing'}
                    </p>
                    <p style={{ color: result.clientEnvStatus.clientFolderIdConfigured ? '#4CAF50' : '#F44336', margin: '5px 0' }}>
                        NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID: {result.clientEnvStatus.clientFolderIdConfigured ? '✅ Configured' : '❌ Missing'}
                    </p>
                </div>

                <div style={{ textAlign: 'left', marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    <h3 style={{ color: 'white', marginBottom: '10px' }}>Server Environment</h3>
                    <p style={{ color: result.envStatus.serverApiKeyConfigured ? '#4CAF50' : '#F44336', margin: '5px 0' }}>
                        GOOGLE_DRIVE_API_KEY: {result.envStatus.serverApiKeyConfigured ? '✅ Configured' : '❌ Missing'}
                    </p>
                    <p style={{ color: result.envStatus.serverFolderIdConfigured ? '#4CAF50' : '#F44336', margin: '5px 0' }}>
                        GOOGLE_DRIVE_FOLDER_ID: {result.envStatus.serverFolderIdConfigured ? '✅ Configured' : '❌ Missing'}
                    </p>
                </div>

                {result.success ? (
                    <div style={{ textAlign: 'left', marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                        <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Google Drive Connection Successful</h3>
                        <p style={{ color: 'white', margin: '5px 0' }}>
                            Folder Name: {result.folderInfo?.name || 'Unknown'}
                        </p>
                        <p style={{ color: 'white', margin: '5px 0' }}>
                            Files Found: {result.sampleFiles?.length || 0}
                        </p>
                        {result.sampleFiles && result.sampleFiles.length > 0 && (
                            <>
                                <p style={{ color: 'white', margin: '10px 0 5px' }}>Sample Files:</p>
                                <ul style={{ color: '#BBBBBB', margin: '0', paddingLeft: '20px' }}>
                                    {result.sampleFiles.map((file: any) => (
                                        <li key={file.id} style={{ margin: '3px 0' }}>
                                            {file.name} ({file.mimeType})
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'left', marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                        <h3 style={{ color: '#F44336', marginBottom: '10px' }}>API Connection Error</h3>
                        <p style={{ color: 'white', margin: '5px 0' }}>
                            Error: {result.error}
                        </p>
                        <p style={{ color: 'white', margin: '5px 0' }}>
                            Details: {result.details}
                        </p>
                    </div>
                )}

                <div className={styles.helpText}>
                    <h3>Setup Instructions:</h3>
                    <ol>
                        <li>Copy .env.local.example to .env.local in the project root</li>
                        <li>Add your Google Drive API key to both environment variables:
                            <ul>
                                <li>NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY</li>
                                <li>GOOGLE_DRIVE_API_KEY</li>
                            </ul>
                        </li>
                        <li>Add your Google Drive Folder ID to both environment variables:
                            <ul>
                                <li>NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID</li>
                                <li>GOOGLE_DRIVE_FOLDER_ID</li>
                            </ul>
                        </li>
                        <li>Make sure your Google Drive folder is shared publicly</li>
                        <li>Restart the development server with npm run dev</li>
                    </ol>
                </div>

                <button onClick={handleRetry} className={styles.retryButton}>
                    Check Again
                </button>
            </div>
        </div>
    );
};

export default ApiChecker;
