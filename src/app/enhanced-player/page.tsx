'use client';

import React, { useState, useEffect } from 'react';
import EnhancedGoogleDrivePlayer from '../../components/EnhancedGoogleDrivePlayer';
import GoogleDriveIframePlayer from '../../components/GoogleDriveIframePlayer';

export default function EnhancedPlayerPage() {
    // Hardcode API key and folder ID from .env.local for client-side use
    const [apiKey, setApiKey] = useState<string>('AIzaSyCL9kMPcwLcJNSPozGYHSyH1s4Tv_Ef_mo');
    const [folderId, setFolderId] = useState<string>('1bKE6PHclPJhuo8MgzhuDFzK4pKgfC6Qy');
    const [componentVisible, setComponentVisible] = useState<boolean>(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toLocaleTimeString());

    useEffect(() => {
        // Log environment variables for debugging
        console.log("EnhancedPlayerPage mounted");
        console.log("API Key Available:", !!apiKey, "Length:", apiKey?.length || 0);
        console.log("Folder ID Available:", !!folderId, "Length:", folderId?.length || 0);
    }, [apiKey, folderId]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '40px 20px',
            minHeight: '100vh'
        }}>            <h1 style={{
            textAlign: 'center',
            color: 'white',
            marginBottom: '30px',
            fontWeight: 800,
            fontSize: '2.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>

            </h1>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '30px',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <p><strong>Player Status:</strong> API Key: {apiKey ? "✅ Ready" : "❌ Missing"} | Folder ID: {folderId ? "✅ Ready" : "❌ Missing"}</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Force Reload Page
                        </button>
                        <button
                            onClick={() => {
                                console.log("Remounting component...");
                                setComponentVisible(false);
                                setTimeout(() => {
                                    setComponentVisible(true);
                                    setLastRefreshTime(new Date().toLocaleTimeString());
                                }, 500);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Remount Component
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center', color: 'white' }}>
                <p style={{ fontSize: '16px', opacity: '0.9', marginBottom: '10px' }}>
                    This enhanced player uses Video.js to provide better compatibility with Google Drive videos.
                </p>
                <p style={{ fontSize: '14px', opacity: '0.7' }}>
                    The player attempts direct streaming of Google Drive videos for a better viewing experience.
                </p>
                <p style={{ fontSize: '12px', opacity: '0.6', marginTop: '5px' }}>
                    Last component refresh: {lastRefreshTime}
                </p>
            </div>

            {componentVisible && (
                <EnhancedGoogleDrivePlayer
                    apiKey={apiKey}
                    folderId={folderId}
                    enableSearch={true}
                />
            )}

            {!componentVisible && (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    margin: '20px 0'
                }}>
                    <p>Reloading component...</p>
                </div>
            )}            <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <a
                    href="/google-drive"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        display: 'inline-block'
                    }}
                >
                    Original Player
                </a>
                <a
                    href="/iframe-player"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#e67e22',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        display: 'inline-block'
                    }}
                >
                    Simple Iframe Player
                </a>
            </div>
        </div>
    );
}
