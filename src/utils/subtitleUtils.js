/**
 * Tiện ích xử lý subtitle cho videojs
 */

// Hàm chuyển đổi SubRip (SRT) sang WebVTT
export function convertSrtToVtt(srtContent) {
    if (!srtContent) return null;

    // Thêm header WebVTT
    let vttContent = 'WEBVTT\n\n';

    // Chuyển đổi định dạng thời gian từ SRT (00:00:00,000) sang WebVTT (00:00:00.000)
    vttContent += srtContent.replace(/(\d+):(\d+):(\d+),(\d+)/g, '$1:$2:$3.$4');

    return vttContent;
}

// Hàm tải file subtitle từ URL và xử lý
export async function loadSubtitleFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const content = await response.text();

        // Xác định loại file từ URL hoặc nội dung
        const isSrt = url.toLowerCase().endsWith('.srt') || content.includes('-->') && !content.includes('WEBVTT');

        if (isSrt) {
            return convertSrtToVtt(content);
        }

        return content;
    } catch (error) {
        console.error('Error loading subtitle file:', error);
        return null;
    }
}

// Tạo Blob URL từ nội dung subtitle để sử dụng trong VideoJS
export function createSubtitleBlobUrl(content, mimeType = 'text/vtt') {
    try {
        const blob = new Blob([content], { type: mimeType });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error creating subtitle blob URL:', error);
        return null;
    }
}

// Normalize subtitle URL to handle special characters properly
export function normalizeSubtitleUrl(url) {
    if (!url) return '';

    try {
        // Handle relative URLs
        if (url.startsWith('/')) {
            const urlParts = url.split('/');
            const fileName = urlParts.pop();
            const path = urlParts.join('/');

            // Ensure the filename is properly encoded
            if (fileName) {
                // First decode to handle cases where it might be double-encoded
                const decodedFileName = decodeURIComponent(fileName);
                const encodedFileName = encodeURIComponent(decodedFileName);

                // If we're in browser context, add origin
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                return `${origin}${path}/${encodedFileName}`;
            }
        }

        return url;
    } catch (error) {
        console.error('Error normalizing subtitle URL:', error); return url;
    }
}

// Hàm để thêm subtitle vào player
export function addSubtitleToPlayer(player, subtitleUrl, language = 'vi', label = 'Vietnamese') {
    if (!player || !subtitleUrl) return;

    try {
        // Xóa tất cả subtitle hiện tại
        const tracks = player.textTracks();
        for (let i = tracks.length - 1; i >= 0; i--) {
            player.removeRemoteTextTrack(tracks[i]);
        }

        // Thêm subtitle mới
        const track = player.addRemoteTextTrack({
            kind: 'subtitles',
            src: subtitleUrl,
            srclang: language,
            label: label,
            default: true
        }, false);

        // Đảm bảo subtitle được hiển thị
        track.mode = 'showing';

    } catch (error) {
        console.error('Error adding subtitle to player:', error);
    }
}
