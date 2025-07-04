'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';
// Import HTTP Streaming plugin cho subtitle
import '@videojs/http-streaming';
// Import subtitle utilities
import { normalizeSubtitleUrl, loadSubtitleFromUrl } from '../utils/subtitleUtils';

interface VideoPlayerProps {
    src: string;
    type?: string;
    title?: string;
    autoplay?: boolean;
    controls?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    className?: string;
    subtitle?: string; // URL của tệp phụ đề
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
    subtitle,
    onReady
}) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);    // Xử lý việc load subtitles
    const loadSubtitle = (player: Player, subtitleUrl: string) => {
        if (!subtitleUrl) {
            console.warn('No subtitle URL provided');
            return;
        }

        console.log('Loading subtitle:', subtitleUrl);
        // Use the utility function to normalize the subtitle URL
        let normalizedSubtitleUrl = normalizeSubtitleUrl(subtitleUrl);

        console.log('Normalized subtitle URL:', normalizedSubtitleUrl);

        // Kiểm tra URL subtitle có tồn tại không
        fetch(normalizedSubtitleUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                console.log('Subtitle file exists and is accessible');
                return response.text();
            })
            .then(content => {
                console.log('Subtitle content preview:', content.substring(0, 100));

                if (content.trim().startsWith('WEBVTT')) {
                    console.log('Valid WebVTT file detected');
                } else {
                    console.warn('Warning: Subtitle file does not start with WEBVTT header');
                }
            })
            .catch(error => {
                console.error('Error fetching subtitle:', error);

                // Try an alternative URL format as fallback
                const fallbackUrl = subtitleUrl.startsWith('/')
                    ? `${window.location.origin}${subtitleUrl}`
                    : subtitleUrl;

                if (fallbackUrl !== normalizedSubtitleUrl) {
                    console.log('Trying fallback subtitle URL:', fallbackUrl);
                    fetch(fallbackUrl)
                        .then(response => {
                            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                            console.log('Fallback subtitle URL works!');
                            return response.text();
                        })
                        .then(content => console.log('Fallback subtitle content preview:', content.substring(0, 100)))
                        .catch(err => console.error('Fallback subtitle fetch also failed:', err));
                }
            });

        try {
            // Xóa tất cả subtitle track cũ
            const textTracks = player.textTracks() as any;
            for (let i = textTracks.length - 1; i >= 0; i--) {
                const track = textTracks[i];
                if (track && player.removeRemoteTextTrack) {
                    player.removeRemoteTextTrack(track);
                }
            }

            console.log('Using normalized subtitle URL:', normalizedSubtitleUrl);

            player.addRemoteTextTrack({
                kind: 'subtitles',
                src: normalizedSubtitleUrl,
                srclang: 'vi',
                label: 'Vietnamese',
                default: true
            }, false);

            // Đảm bảo subtitle được hiển thị
            setTimeout(() => {
                const tracks = player.textTracks() as any;
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].kind === 'subtitles') {
                        tracks[i].mode = 'showing';
                        console.log('Successfully set subtitle track to showing mode');
                        break;
                    }
                }
            }, 1000);
        } catch (err) {
            console.error('Error loading subtitle:', err);
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
