'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';
// Import HTTP Streaming plugin cho subtitle
import '@videojs/http-streaming';
// Import subtitle utilities
import {
    normalizeSubtitleUrl,
    loadSubtitleFromUrl,
    createSubtitleBlobUrl,
    addSubtitleToPlayer
} from '../utils/subtitleUtils';

interface VideoPlayerProps {
    // Các thuộc tính hiện có giữ nguyên
    src: string;
    type?: string;
    title?: string;
    autoplay?: boolean;
    controls?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    className?: string;
    subtitle?: string;
    onReady?: (player: Player) => void;
    playlist?: Array<{ src: string; subtitle?: string; title?: string }>;
    onVideoChange?: (index: number) => void;
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
    subtitle,
    onReady,
    playlist = [],
    onVideoChange
}) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const currentIndex = useRef(0);
    const loadSubtitle = async (player: Player, subtitleUrl: string) => {
        if (!subtitleUrl) {
            console.warn('No subtitle URL provided');
            return;
        }

        console.log('Loading subtitle:', subtitleUrl);
        const normalizedUrl = normalizeSubtitleUrl(subtitleUrl);
        console.log('Normalized URL:', normalizedUrl);

        const content = await loadSubtitleFromUrl(normalizedUrl);
        console.log("Subtitle content preview:", content?.substring(0, 100));

        if (content) {
            const blobUrl = createSubtitleBlobUrl(content);
            if (blobUrl) {
                addSubtitleToPlayer(player, blobUrl);
            }
        }
    };

    useEffect(() => {
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
                iframe.style.minHeight = '600px';
                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
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
                    pause: () => { },
                    on: () => { }
                } as unknown as Player;

                playerRef.current = mockPlayer;

                if (onReady) onReady(mockPlayer);
                return;
            }

            // Standard VideoJS initialization for normal video sources
            const videoElement = document.createElement('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);

            const playerOptions: any = {
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
                    },
                    nativeTextTracks: false // Sử dụng TextTrack của VideoJS thay vì native
                },
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                controlBar: {
                    pictureInPictureToggle: true,
                    subtitlesButton: true // Hiển thị nút subtitle
                }
            };

            // Add subtitle track if provided
            if (subtitle) {
                console.log('Adding subtitle track:', subtitle);
                if (!playerOptions.tracks) {
                    playerOptions.tracks = [];
                }

                // Chỉ thêm một track subtitle
                playerOptions.tracks.push({
                    kind: 'subtitles',
                    src: subtitle,
                    srclang: 'vi',
                    label: 'Vietnamese',
                    default: true
                });
            }

            const player = playerRef.current = videojs(videoElement, playerOptions, () => {
                // Player is ready
                console.log('VideoJS player is ready');

                // Make sure subtitles are shown if available
                if (subtitle) {
                    loadSubtitle(player, subtitle);
                }
                if (playlist && playlist.length > 0) {
                    player.on('ended', () => {
                        console.log('Video ended, playing next video in playlist');
                        currentIndex.current = (currentIndex.current + 1) % playlist.length;
                        const nextVideo = playlist[currentIndex.current];

                        if (nextVideo && nextVideo.src) {
                            console.log('Switching to next video:', nextVideo.src);

                            // Remove all existing text tracks before adding a new one
                            const tracks = player.remoteTextTracks();
                            const trackArray = Array.from(tracks as any as TextTrack[]);
                            let i = trackArray.length;
                            while (i--) {
                                player.removeRemoteTextTrack(trackArray[i]);
                            }

                            player.src({ src: nextVideo.src, type });

                            if (nextVideo.subtitle) {
                                loadSubtitle(player, nextVideo.subtitle);
                            }

                            player.play()?.catch(error => {
                                console.error('Error playing next video:', error);
                            });

                            if (onVideoChange) {
                                onVideoChange(currentIndex.current);
                            }
                        } else {
                            console.error('Invalid next video data:', nextVideo);
                        }
                    });
                }

                if (onReady) onReady(player);
            });

            // Add title if provided
            if (title) {
                const titleOverlay = document.createElement('div');
                titleOverlay.className = 'vjs-title-overlay';
                titleOverlay.innerHTML = `<div class="vjs-title-text">${title}</div>`;
                videoRef.current.appendChild(titleOverlay);
            }
        } else {
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
                        const iframe = document.createElement('iframe');
                        iframe.src = src;
                        iframe.width = '100%';
                        iframe.height = '100%';
                        iframe.style.border = 'none';
                        iframe.style.minHeight = '600px';
                        iframe.style.position = 'absolute';
                        iframe.style.top = '0';
                        iframe.style.left = '0';
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.setAttribute('allowFullScreen', 'true');
                        iframe.allow = 'autoplay; encrypted-media';

                        if (videoRef.current) {
                            videoRef.current.innerHTML = '';
                            videoRef.current.appendChild(iframe);
                        }

                        // Create a mock player
                        const mockPlayer = {
                            src: (sourceObj: any) => {
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
                            pause: () => { },
                            on: () => { }
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

                // Update subtitles if provided
                if (subtitle) {
                    loadSubtitle(player, subtitle);
                }
            }
        }
    }, [src, type, videoRef, controls, autoplay, responsive, fluid, title, subtitle, onReady]);

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
        <div data-vjs-player style={{
            width: '100%',
            height: '100%',
            minHeight: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div
                ref={videoRef}
                className={`video-js-container ${className}`}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '600px',
                    overflow: 'hidden'
                }}
            ></div>
        </div>
    );
};

export default VideoJSPlayer;
