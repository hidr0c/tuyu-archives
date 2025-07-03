'use client';

import React, { useState, useEffect } from 'react';
import GoogleDriveIframePlayer from '../../components/GoogleDriveIframePlayer';

export default function IframePlayerPage() {
    // Hardcode API key and folder ID from .env.local for client-side use
    const [apiKey, setApiKey] = useState<string>('AIzaSyCL9kMPcwLcJNSPozGYHSyH1s4Tv_Ef_mo');
    const [folderId, setFolderId] = useState<string>('1bKE6PHclPJhuo8MgzhuDFzK4pKgfC6Qy');
    const [componentVisible, setComponentVisible] = useState<boolean>(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<string>(new Date().toLocaleTimeString());

    useEffect(() => {
        // Log environment variables for debugging
        console.log("IframePlayerPage mounted");
        console.log("API Key Available:", !!apiKey, "Length:", apiKey?.length || 0);
        console.log("Folder ID Available:", !!folderId, "Length:", folderId?.length || 0);
    }, [apiKey, folderId]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1800px',
            margin: '0 auto',
            padding: '40px 20px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(240, 240, 245, 0.5))',
            minHeight: '100vh',
            color: '#333',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>            <h1 style={{
            textAlign: 'center',
            color: '#333',
            marginBottom: '40px',
            fontWeight: 800,
            fontSize: '2.8rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            padding: '10px 0'
        }}>
            </h1>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px'
            }}>                <div style={{
                padding: '20px 25px',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '15px',
                marginBottom: '30px',
                color: '#333',
                textAlign: 'center',
                backdropFilter: 'blur(5px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.4)'
            }}>
                    <p style={{ fontSize: '16px', marginBottom: '15px' }}>
                        <strong>Player Status:</strong>
                        <span style={{
                            display: 'inline-block',
                            margin: '0 10px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            backgroundColor: apiKey ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                            border: apiKey ? '1px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)'
                        }}>
                            API Key: {apiKey ? "✅ Ready" : "❌ Missing"}
                        </span> |
                        <span style={{
                            display: 'inline-block',
                            margin: '0 10px',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            backgroundColor: folderId ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                            border: folderId ? '1px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)'
                        }}>
                            Folder ID: {folderId ? "✅ Ready" : "❌ Missing"}
                        </span>
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        marginTop: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>🔄</span> Force Reload Page
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
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>⟳</span> Remount Component
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
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>🛠️</span> Show Debug Info
                        </button>
                    </div>
                </div>
            </div>            <div style={{
                marginBottom: '30px',
                textAlign: 'center',
                color: '#333',
                background: 'rgba(255, 255, 255, 0.4)',
                padding: '20px 25px',
                borderRadius: '15px',
                maxWidth: '800px',
                margin: '0 auto 30px auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(5px)'
            }}>                <h3 style={{
                fontSize: '1.4rem',
                color: '#333',
                marginBottom: '15px',
                fontWeight: '600'
            }}>
                    About This Player
                </h3>
                <p style={{ fontSize: '16px', opacity: '0.95', marginBottom: '12px', lineHeight: '1.5' }}>
                    This modern player uses iframes to embed Google Drive videos directly with a responsive,
                    feature-rich interface including search and playlist functionality.
                </p>
                <p style={{ fontSize: '15px', opacity: '0.8', marginBottom: '10px', lineHeight: '1.5' }}>
                    This is the most reliable way to play Google Drive videos without content-disposition issues.
                    The player handles authentication and provides stable playback across devices.
                </p>
                <p style={{
                    fontSize: '14px',
                    opacity: '0.7',
                    marginTop: '10px',
                    display: 'inline-block',
                    background: 'rgba(52, 152, 219, 0.2)',
                    padding: '5px 15px',
                    borderRadius: '20px'
                }}>
                    🕒 Last component refresh: {lastRefreshTime}
                </p>
            </div>

            {componentVisible && (
                <GoogleDriveIframePlayer
                    apiKey={apiKey}
                    folderId={folderId}
                    enableSearch={true}
                />
            )}

            {!componentVisible && (
                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '15px',
                    margin: '20px 0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '0 auto 20px auto',
                        border: '4px solid rgba(255, 255, 255, 0.1)',
                        borderLeftColor: '#3498db',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontSize: '18px', fontWeight: '500' }}>Reloading component...</p>
                </div>
            )}

            <div style={{
                marginTop: '50px',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <a
                    href="/"
                    style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(155, 89, 182, 0.5)'
                    }}
                >
                    <span>🏠</span> Main Page
                </a>
                <a
                    href="/google-drive"
                    style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #3498db, #2980b9)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(52, 152, 219, 0.5)'
                    }}
                >
                    <span>📺</span> Original Player
                </a>
                <a
                    href="/enhanced-player"
                    style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(46, 204, 113, 0.5)'
                    }}
                >
                    <span>✨</span> Enhanced Player
                </a>
            </div>
        </div>
    );
}
