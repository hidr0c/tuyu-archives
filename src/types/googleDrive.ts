export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webContentLink: string;
  webViewLink: string;
  parents?: string[];
  createdTime: string;
  modifiedTime: string;
}

export interface GoogleDriveVideo {
  video: GoogleDriveFile;
  subtitle?: GoogleDriveFile;
  title: string;
  artist?: string;
}

export interface GoogleDriveApiResponse {
  kind: string;
  incompleteSearch: boolean;
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export interface GoogleDriveConfig {
  apiKey: string;
  folderId?: string;
  videoMimeTypes: string[];
  subtitleMimeTypes: string[];
}
