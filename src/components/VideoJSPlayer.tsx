'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
    src: string;
    type?: string;
    title?: string;
    autoplay?: boolean;
    controls?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    className?: string;
    onReady?: (player: Player) => void;
}

const VideoJSPlayer: React.FC<VideoPlayerProps> = ({
    src,
    type = 'video/mp4',
    title = 'Video Player',
    autoplay = false,
    controls = true,
    responsive = true,
    fluid = true,
    className = '',
    onReady
}) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            if (!videoRef.current) return;

            // For Google Drive preview URLs or when type is explicitly text/html, we use iframe
            const useIframe = src.includes('drive.google.com/file') && src.includes('/preview') || type === 'text/html';
            
            if (useIframe) {
                console.log('Using iframe player for URL:', src);
                
                const iframe = document.createElement('iframe');
                iframe.src = src;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.style.border = 'none';
                iframe.setAttribute('allowFullScreen', 'true');
                iframe.allow = 'autoplay; encrypted-media';
                
                if (videoRef.current) {
                    videoRef.current.innerHTML = '';
                    videoRef.current.appendChild(iframe);
                }
                
                // Create a mock player object to satisfy the interface
                const mockPlayer = {
                    src: (sourceObj: any) => {
                        console.log('Updating iframe source:', sourceObj.src);
                        if (iframe && videoRef.current) {
                            iframe.src = sourceObj.src;
                        }
                    },
                    dispose: () => {
                        if (iframe && videoRef.current) {
                            iframe.remove();
                        }
                    },
                    isDisposed: () => false,
                    play: () => Promise.resolve(),
                    pause: () => {},
                    on: () => {}
                } as unknown as Player;
                
                playerRef.current = mockPlayer;
                
                if (onReady) onReady(mockPlayer);
                return;
            }
            
            // Standard VideoJS initialization for normal video sources
            const videoElement = document.createElement('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);
            
            const player = playerRef.current = videojs(videoElement, {
                controls,
                autoplay,
                responsive,
                fluid,
                sources: [{
                    src,
                    type
                }],
                html5: {
                    vhs: {
                        overrideNative: true
                    }
                }
            }, () => {
                // Player is ready
                console.log('VideoJS player is ready');
                if (onReady) onReady(player);
            });

            // Add title if provided
            if (title) {
                const titleOverlay = document.createElement('div');
                titleOverlay.className = 'vjs-title-overlay';
                titleOverlay.innerHTML = `<div class="vjs-title-text">${title}</div>`;
                videoRef.current.appendChild(titleOverlay);
            }        } else {
            // Update the player's source if it changes
            const player = playerRef.current;
            
            // For Google Drive preview URLs or when type is explicitly text/html, update iframe
            const useIframe = src.includes('drive.google.com/file') && src.includes('/preview') || type === 'text/html';
            
            if (useIframe) {
                console.log('Updating iframe for source:', src);
                if (videoRef.current) {
                    const iframe = videoRef.current.querySelector('iframe');
                    if (iframe) {
                        iframe.src = src;
                    } else {
                        // The player might have been initialized as a video.js instance
                        // Dispose the old player and reinitialize with iframe
                        if (player && typeof player.dispose === 'function' && !player.isDisposed()) {
                            player.dispose();
                        }
                        
                        // Create iframe for Google Drive preview
                        const newIframe = document.createElement('iframe');
                        newIframe.src = src;
                        newIframe.width = '100%';
                        newIframe.height = '100%';
                        newIframe.style.border = 'none';
                        newIframe.setAttribute('allowFullScreen', 'true');
                        newIframe.allow = 'autoplay; encrypted-media';
                        
                        if (videoRef.current) {
                            videoRef.current.innerHTML = '';
                            videoRef.current.appendChild(newIframe);
                        }
                        
                        // Create a mock player
                        const mockPlayer = {
                            src: (sourceObj: any) => {
                                if (newIframe && videoRef.current) {
                                    newIframe.src = sourceObj.src;
                                }
                            },
                            dispose: () => {
                                if (newIframe && videoRef.current) {
                                    newIframe.remove();
                                }
                            },
                            isDisposed: () => false,
                            play: () => Promise.resolve(),
                            pause: () => {},
                            on: () => {}
                        } as unknown as Player;
                        
                        playerRef.current = mockPlayer;
                    }
                }
            } else {
                // Normal video source update for VideoJS
                player.src({
                    src,
                    type
                });
            }
        }
    }, [src, type, videoRef, controls, autoplay, responsive, fluid, title, onReady]);

    // Cleanup when component unmounts
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div data-vjs-player>
            <div ref={videoRef} className={`video-js-container ${className}`}></div>
        </div>
    );
};

export default VideoJSPlayer;
