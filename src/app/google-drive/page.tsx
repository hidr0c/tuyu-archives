'use client';

import React, { useState, useEffect } from 'react';
import GoogleDrivePlayer from '../../components/GoogleDrivePlayer';
import EnhancedGoogleDrivePlayer from '../../components/EnhancedGoogleDrivePlayer';

export default function GoogleDrivePage() {
    // Hardcode API key and folder ID from .env.local for client-side use
    const [apiKey, setApiKey] = useState<string>('AIzaSyCL9kMPcwLcJNSPozGYHSyH1s4Tv_Ef_mo');
    const [folderId, setFolderId] = useState<string>('1bKE6PHclPJhuo8MgzhuDFzK4pKgfC6Qy');
    const [componentVisible, setComponentVisible] = useState<boolean>(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toLocaleTimeString());

    useEffect(() => {
        // Log environment variables for debugging
        console.log("GoogleDrivePage mounted");
        console.log("API Key Available:", !!apiKey, "Length:", apiKey?.length || 0);
        console.log("Folder ID Available:", !!folderId, "Length:", folderId?.length || 0);

        // Direct API test
        const testApiAccess = async () => {
            try {
                console.log("Testing API access directly from page component");
                const testUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=id,name,mimeType`;
                const response = await fetch(testUrl);
                const data = await response.json();
                console.log("API Test Result:", data);
            } catch (error) {
                console.error("API Test Error:", error);
            }
        };

        testApiAccess();
    }, [apiKey, folderId]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '40px 20px',
            background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.97), rgba(30, 30, 50, 0.97))',
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

            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <a
                    href="/enhanced-player"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        display: 'inline-block',
                        fontWeight: 'bold'
                    }}
                >
                    Try Enhanced Player (Video.js) 🎬
                </a>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                <div style={{
                    padding: '15px',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
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
                        <button
                            onClick={() => {
                                console.log("Debug information:", {
                                    apiKey,
                                    folderId,
                                    envApiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY,
                                    envFolderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID
                                });
                                alert(`API Key: ${apiKey ? "Available" : "Missing"}\nFolder ID: ${folderId ? "Available" : "Missing"}`);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Show Debug Info
                        </button>
                    </div>
                </div>            </div>            <div style={{ marginBottom: '20px', textAlign: 'center', color: 'white' }}>
                <p style={{ fontSize: '14px', opacity: '0.7' }}>
                    Searching for videos in Google Drive folder. If nothing appears, check the console for errors.
                </p>
                <p style={{ fontSize: '12px', opacity: '0.6', marginTop: '5px' }}>
                    Last component refresh: {lastRefreshTime}
                </p>
            </div>            {componentVisible && (
                <>
                    <h2 style={{
                        textAlign: 'center',
                        color: 'white',
                        marginBottom: '30px',
                        fontWeight: 600,
                        fontSize: '1.8rem'
                    }}>
                        Enhanced Google Drive Player (with Video.js)
                    </h2>
                    <EnhancedGoogleDrivePlayer
                        apiKey={apiKey}
                        folderId={folderId}
                        enableSearch={true}
                    />

                    <div style={{ margin: '40px 0', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0' }}></div>

                    <h2 style={{
                        textAlign: 'center',
                        color: 'white',
                        marginBottom: '30px',
                        fontWeight: 600,
                        fontSize: '1.8rem'
                    }}>
                        Original Google Drive Player (iframe)
                    </h2>
                    <GoogleDrivePlayer
                        apiKey={apiKey}
                        folderId={folderId}
                        enableSearch={true}
                    />
                </>
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
            )}
        </div>
    );
}
