import {
  GoogleDriveFile,
  GoogleDriveVideo,
  GoogleDriveApiResponse,
  GoogleDriveConfig,
} from "../types/googleDrive";

export class GoogleDriveService {
  private config: GoogleDriveConfig;
  private baseUrl = "https://www.googleapis.com/drive/v3/files";
  constructor(config: GoogleDriveConfig) {
    const defaultVideoMimeTypes = [
      "video/webm",
      "video/mp4",
      "video/x-matroska", // .mkv
      "video/avi",
      "video/quicktime", // .mov
    ];

    const defaultSubtitleMimeTypes = [
      "text/vtt",
      "text/plain", // .srt, .txt
      "application/x-subrip", // .srt
    ];

    this.config = {
      ...config,
      videoMimeTypes: config.videoMimeTypes || defaultVideoMimeTypes,
      subtitleMimeTypes: config.subtitleMimeTypes || defaultSubtitleMimeTypes,
    };
  }

  /**
   * Get all files from Google Drive folder
   */
  async getFiles(pageToken?: string): Promise<GoogleDriveApiResponse> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        fields:
          "kind,incompleteSearch,nextPageToken,files(id,name,mimeType,size,webContentLink,webViewLink,parents,createdTime,modifiedTime)",
        orderBy: "name",
        pageSize: "100",
      });

      // If folderId is specified, search within that folder
      if (this.config.folderId) {
        params.append(
          "q",
          `'${this.config.folderId}' in parents and trashed=false`
        );
      } else {
        params.append("q", "trashed=false");
      }

      if (pageToken) {
        params.append("pageToken", pageToken);
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Drive API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching files from Google Drive:", error);
      throw error;
    }
  }

  /**
   * Get all video and subtitle files
   */
  async getAllMediaFiles(): Promise<GoogleDriveFile[]> {
    const allFiles: GoogleDriveFile[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await this.getFiles(nextPageToken);
      allFiles.push(...response.files);
      nextPageToken = response.nextPageToken;
    } while (nextPageToken);

    // Filter only video and subtitle files
    return allFiles.filter(
      (file) => this.isVideoFile(file) || this.isSubtitleFile(file)
    );
  }

  /**
   * Match videos with their corresponding subtitles
   */
  async getVideosWithSubtitles(): Promise<GoogleDriveVideo[]> {
    const mediaFiles = await this.getAllMediaFiles();
    const videoFiles = mediaFiles.filter((file) => this.isVideoFile(file));
    const subtitleFiles = mediaFiles.filter((file) =>
      this.isSubtitleFile(file)
    );

    return videoFiles.map((video) => {
      const videoBaseName = this.getBaseName(video.name);
      const matchingSubtitle = subtitleFiles.find((subtitle) => {
        const subtitleBaseName = this.getBaseName(subtitle.name);
        return videoBaseName === subtitleBaseName;
      });

      return {
        video,
        subtitle: matchingSubtitle,
        title: this.extractTitle(video.name),
        artist: this.extractArtist(video.name),
      };
    });
  }

  /**
   * Get direct download URL for a file
   */
  getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Get streaming URL for video (works better for large files)
   */
  getStreamingUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  /**
   * Check if file is a video
   */
  private isVideoFile(file: GoogleDriveFile): boolean {
    return (
      this.config.videoMimeTypes.includes(file.mimeType) ||
      file.name.match(/\.(webm|mp4|mkv|avi|mov)$/i) !== null
    );
  }

  /**
   * Check if file is a subtitle
   */
  private isSubtitleFile(file: GoogleDriveFile): boolean {
    return (
      this.config.subtitleMimeTypes.includes(file.mimeType) ||
      file.name.match(/\.(vtt|srt|txt)$/i) !== null
    );
  }

  /**
   * Get base name without extension for matching
   */
  private getBaseName(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "");
  }

  /**
   * Extract title from filename (assuming format: "ARTIST - TITLE.ext")
   */
  private extractTitle(filename: string): string {
    const nameWithoutExt = this.getBaseName(filename);
    const parts = nameWithoutExt.split(" - ");

    if (parts.length >= 2) {
      return parts.slice(1).join(" - ").trim();
    }

    return nameWithoutExt.replace(/_/g, " ").trim();
  }

  /**
   * Extract artist from filename (assuming format: "ARTIST - TITLE.ext")
   */
  private extractArtist(filename: string): string | undefined {
    const nameWithoutExt = this.getBaseName(filename);
    const parts = nameWithoutExt.split(" - ");

    if (parts.length >= 2) {
      return parts[0].trim();
    }

    return undefined;
  }

  /**
   * Search files by query
   */
  async searchFiles(query: string): Promise<GoogleDriveFile[]> {
    try {
      const params = new URLSearchParams({
        key: this.config.apiKey,
        q: `name contains '${query}' and trashed=false`,
        fields:
          "files(id,name,mimeType,size,webContentLink,webViewLink,parents,createdTime,modifiedTime)",
        orderBy: "name",
      });

      if (this.config.folderId) {
        params.set(
          "q",
          `'${this.config.folderId}' in parents and name contains '${query}' and trashed=false`
        );
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Drive API error: ${response.status} ${response.statusText}`
        );
      }

      const data: GoogleDriveApiResponse = await response.json();
      return data.files;
    } catch (error) {
      console.error("Error searching files in Google Drive:", error);
      throw error;
    }
  }
}
