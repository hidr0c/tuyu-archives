import { NextApiRequest, NextApiResponse } from "next";
import { google, drive_v3 } from "googleapis";

interface VideoWithSubtitle {
  video: string;
  subtitle: string;
  title?: string;
  artist?: string;
  folder: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!API_KEY || !FOLDER_ID) {
      return res.status(500).json({
        error:
          "Missing Google Drive API configuration. Please check your environment variables.",
      });
    }
    const drive = google.drive({ version: "v3", auth: API_KEY });
    // Log API configuration for debugging
    console.log(`Using API Key: ${API_KEY ? "Configured" : "Missing"}`);
    console.log(`Using Folder ID: ${FOLDER_ID}`);

    // Get all folders in the root directory
    const foldersResponse = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    const folders = foldersResponse.data.files || [];
    console.log(`Found ${folders.length} folders in root directory`);

    if (folders.length === 0) {
      console.log(
        "No folders found. Checking if the folder ID exists or is accessible..."
      );
      try {
        // Try to get info about the root folder itself
        const folderInfo = await drive.files.get({
          fileId: FOLDER_ID,
          fields: "id,name,mimeType,trashed",
        });
        console.log("Root folder info:", folderInfo.data);
      } catch (folderErr) {
        console.error("Error checking root folder:", folderErr);
      }
    }
    const allVideos: VideoWithSubtitle[] = [];

    // Process each folder
    for (const folder of folders) {
      console.log(`Processing folder: ${folder.name}`);

      // Get all files in the current folder
      const filesResponse = await drive.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: "files(id, name, mimeType, parents)",
      });

      const allFiles = filesResponse.data.files || [];

      // Separate videos and subtitles
      const videoFiles = allFiles.filter(
        (file: drive_v3.Schema$File) =>
          file.mimeType?.startsWith("video/") ||
          file.name?.match(/\.(mp4|webm|mkv|avi|mov)$/i)
      );

      const subtitleFiles = allFiles.filter((file: drive_v3.Schema$File) =>
        file.name?.match(/\.(vtt|srt|ass|ssa)$/i)
      );

      // Check for subtitle subfolder
      const subtitleFolder = allFiles.find(
        (file: drive_v3.Schema$File) =>
          file.mimeType === "application/vnd.google-apps.folder" &&
          (file.name?.toLowerCase().includes("subtitle") ||
            file.name?.toLowerCase().includes("sub") ||
            file.name?.toLowerCase().includes("srt") ||
            file.name?.toLowerCase().includes("vtt"))
      );

      let additionalSubtitles: drive_v3.Schema$File[] = [];
      if (subtitleFolder) {
        console.log(`Found subtitle folder: ${subtitleFolder.name}`);
        const subtitleFolderResponse = await drive.files.list({
          q: `'${subtitleFolder.id}' in parents and trashed=false`,
          fields: "files(id, name, mimeType, parents)",
        });

        additionalSubtitles =
          subtitleFolderResponse.data.files?.filter(
            (file: drive_v3.Schema$File) =>
              file.name?.match(/\.(vtt|srt|ass|ssa)$/i)
          ) || [];
      }

      // Combine subtitles from main folder and subtitle folder
      const allSubtitles = [...subtitleFiles, ...additionalSubtitles];

      // Match videos with subtitles
      for (const video of videoFiles) {
        if (!video.id || !video.name) continue;

        const videoBaseName = getBaseName(video.name);

        // Find matching subtitle
        const matchingSubtitle = allSubtitles.find((subtitle) => {
          if (!subtitle.name) return false;
          const subtitleBaseName = getBaseName(subtitle.name);
          return subtitleBaseName === videoBaseName;
        });

        // Create download URLs
        const videoUrl = `https://drive.google.com/uc?export=download&id=${video.id}`;
        const subtitleUrl =
          matchingSubtitle && matchingSubtitle.id
            ? `https://drive.google.com/uc?export=download&id=${matchingSubtitle.id}`
            : "";

        // Parse title and artist from filename
        const { title, artist } = parseFileName(video.name);

        allVideos.push({
          video: videoUrl,
          subtitle: subtitleUrl,
          title,
          artist,
          folder: folder.name || "Unknown",
        });
      }
    }

    console.log(`Total videos found: ${allVideos.length}`);

    // Sort videos by folder and then by name
    allVideos.sort((a, b) => {
      if (a.folder !== b.folder) {
        return a.folder.localeCompare(b.folder);
      }
      const aName = a.title || a.video;
      const bName = b.title || b.video;
      return aName.localeCompare(bName);
    });
    res.status(200).json({
      videos: allVideos,
      totalCount: allVideos.length,
      folders: Array.from(new Set(allVideos.map((v) => v.folder))),
    });
  } catch (error) {
    console.error("Error fetching Google Drive videos:", error);
    res.status(500).json({
      error: "Failed to fetch videos from Google Drive",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function getBaseName(filename: string): string {
  // Remove file extension and clean up the name
  return filename
    .replace(/\.[^/.]+$/, "") // Remove extension
    .toLowerCase()
    .trim();
}

function parseFileName(filename: string): { title?: string; artist?: string } {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Try to parse patterns like "Artist - Title" or "TUYU - Song Name"
  const artistTitleMatch = nameWithoutExt.match(/^(.+?)\s*-\s*(.+)$/);

  if (artistTitleMatch) {
    return {
      artist: artistTitleMatch[1].trim(),
      title: artistTitleMatch[2].trim(),
    };
  }

  // Try to parse patterns with parentheses or brackets
  const bracketMatch = nameWithoutExt.match(/^([^([]+)[\s([]+(.+?)[\s)\]]*$/);

  if (bracketMatch) {
    return {
      artist: bracketMatch[1].trim(),
      title: bracketMatch[2].trim(),
    };
  }

  // If no pattern matches, return the full name as title
  return {
    title: nameWithoutExt.replace(/_/g, " ").trim(),
  };
}
