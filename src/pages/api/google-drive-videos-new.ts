import type { NextApiRequest, NextApiResponse } from "next";

// Types for Google Drive API response
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface GoogleDriveApiResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

interface VideoWithSubtitle {
  video: string;
  subtitle: string;
  title: string;
  artist?: string;
  folder: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get API key and folder ID from environment variables or query parameters
    const apiKey =
      process.env.GOOGLE_DRIVE_API_KEY || (req.query.apiKey as string);
    const mainFolderId =
      process.env.GOOGLE_DRIVE_FOLDER_ID || (req.query.folderId as string);

    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Google Drive API key is required" });
    }

    if (!mainFolderId) {
      return res.status(400).json({ error: "Main folder ID is required" });
    }

    // Fetch all subfolders from main folder
    const subfolders = await getSubfolders(apiKey, mainFolderId);

    // Process each subfolder to get videos and subtitles
    const allVideos: VideoWithSubtitle[] = [];

    for (const subfolder of subfolders) {
      const folderVideos = await processFolderVideos(apiKey, subfolder);
      allVideos.push(...folderVideos);
    }

    return res.status(200).json({ videos: allVideos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch videos from Google Drive" });
  }
}

async function getSubfolders(
  apiKey: string,
  parentFolderId: string
): Promise<GoogleDriveFile[]> {
  const baseUrl = "https://www.googleapis.com/drive/v3/files";
  const fields = "files(id, name, mimeType)";

  const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    fields,
    orderBy: "name",
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Google Drive API error: ${
        errorData.error?.message || response.statusText
      }`
    );
  }

  const data: GoogleDriveApiResponse = await response.json();
  return data.files;
}

async function getFilesInFolder(
  apiKey: string,
  folderId: string
): Promise<GoogleDriveFile[]> {
  const baseUrl = "https://www.googleapis.com/drive/v3/files";
  const fields = "files(id, name, mimeType)";

  const query = `'${folderId}' in parents and trashed = false`;

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    fields,
    orderBy: "name",
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Google Drive API error: ${
        errorData.error?.message || response.statusText
      }`
    );
  }

  const data: GoogleDriveApiResponse = await response.json();
  return data.files;
}

async function processFolderVideos(
  apiKey: string,
  folder: GoogleDriveFile
): Promise<VideoWithSubtitle[]> {
  // Get all files in this folder
  const files = await getFilesInFolder(apiKey, folder.id);

  // Separate videos and find subtitle folder
  const videoFiles = files.filter(
    (file) =>
      file.mimeType.includes("video/") ||
      file.name.endsWith(".mp4") ||
      file.name.endsWith(".webm") ||
      file.name.endsWith(".mkv")
  );

  const subtitleFolder = files.find(
    (file) =>
      file.mimeType === "application/vnd.google-apps.folder" &&
      (file.name.toLowerCase().includes("subtitle") ||
        file.name.toLowerCase().includes("sub"))
  );

  let subtitleFiles: GoogleDriveFile[] = [];

  // If subtitle folder exists, get all subtitle files from it
  if (subtitleFolder) {
    const allSubtitleFiles = await getFilesInFolder(apiKey, subtitleFolder.id);
    subtitleFiles = allSubtitleFiles.filter(
      (file) => file.name.endsWith(".vtt") || file.name.endsWith(".srt")
    );
  }

  // Match videos with their subtitles
  return videoFiles.map((video) => {
    const videoBaseName = getBaseName(video.name);

    // Find matching subtitle
    const matchingSubtitle = subtitleFiles.find((subtitle) => {
      const subtitleBaseName = getBaseName(subtitle.name);
      return areFilesMatching(videoBaseName, subtitleBaseName);
    });

    // Extract title and artist
    const { title, artist } = extractTitleAndArtist(video.name);

    return {
      video: `https://drive.google.com/uc?export=download&id=${video.id}`,
      subtitle: matchingSubtitle
        ? `https://drive.google.com/uc?export=download&id=${matchingSubtitle.id}`
        : "",
      title,
      artist,
      folder: folder.name,
    };
  });
}

function getBaseName(filename: string): string {
  return filename.replace(/\.(mp4|webm|mkv|vtt|srt)$/i, "");
}

function areFilesMatching(videoName: string, subtitleName: string): boolean {
  // Exact match
  if (videoName === subtitleName) return true;

  // Partial match
  if (videoName.includes(subtitleName) || subtitleName.includes(videoName))
    return true;

  // Clean and compare (remove special characters)
  const cleanVideo = videoName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const cleanSubtitle = subtitleName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return (
    cleanVideo === cleanSubtitle ||
    cleanVideo.includes(cleanSubtitle) ||
    cleanSubtitle.includes(cleanVideo)
  );
}

function extractTitleAndArtist(filename: string): {
  title: string;
  artist?: string;
} {
  const nameWithoutExt = getBaseName(filename);
  const parts = nameWithoutExt.split(" - ");

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" - ").trim(),
    };
  }

  return {
    title: nameWithoutExt.replace(/_/g, " ").trim(),
  };
}
