import { NextRequest } from "next/server";
import { google } from "googleapis";

interface VideoWithSubtitle {
  video: string;
  videoAlternate?: string;
  videoEmbed?: string;
  subtitle: string;
  title?: string;
  artist?: string;
  folder: string;
  fileId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const API_KEY =
      searchParams.get("apiKey") || process.env.GOOGLE_DRIVE_API_KEY;
    const FOLDER_ID =
      searchParams.get("folderId") || process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log("API Request received:", {
      hasApiKey: !!API_KEY,
      hasFolderId: !!FOLDER_ID,
      apiKeyLength: API_KEY?.length,
      folderIdLength: FOLDER_ID?.length
    });

    if (!API_KEY || !FOLDER_ID) {
      console.error("Missing API configuration:", { API_KEY: !!API_KEY, FOLDER_ID: !!FOLDER_ID });
      return new Response(
        JSON.stringify({
          error: "Missing Google Drive API configuration. Please check your environment variables.",
          debug: {
            hasApiKey: !!API_KEY,
            hasFolderId: !!FOLDER_ID,
            envApiKey: !!process.env.GOOGLE_DRIVE_API_KEY,
            envFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const drive = google.drive({ version: "v3", auth: API_KEY });
    
    console.log("Attempting to list files in folder:", FOLDER_ID);
    
    const folderResponse = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, permissions)",
      pageSize: 1000,
    });

    const files = folderResponse.data.files || [];
    console.log(`Found ${files.length} files in Google Drive folder`);

    const videoFiles = files.filter((file) =>
      file.mimeType?.includes("video/")
    );
    const subtitleFiles = files.filter(
      (file) =>
        file.name?.toLowerCase().endsWith(".vtt") ||
        file.name?.toLowerCase().endsWith(".srt")
    );

    console.log(
      `Found ${videoFiles.length} videos and ${subtitleFiles.length} subtitles`
    );    const videos: VideoWithSubtitle[] = videoFiles.map((videoFile) => {
      const videoName = videoFile.name?.replace(/\.[^/.]+$/, "") || "";
      const matchingSubtitle = subtitleFiles.find((subFile) => {
        const subtitleName = subFile.name?.replace(/\.[^/.]+$/, "") || "";
        return (
          subtitleName.toLowerCase() === videoName.toLowerCase() ||
          subtitleName.includes(videoName) ||
          videoName.includes(subtitleName)
        );
      });
      
      const fileId = videoFile.id || "";
      
      // Parse title and artist from filename (assuming format like "Artist - Title")
      let title = videoName;
      let artist = "";
      
      if (videoName.includes(" - ")) {
        const parts = videoName.split(" - ");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }
      }
      
      return {
        video: `https://drive.google.com/uc?export=view&id=${fileId}`,
        videoEmbed: `https://drive.google.com/file/d/${fileId}/preview`,
        videoDownload: `https://drive.google.com/uc?export=download&id=${fileId}`,
        subtitle: matchingSubtitle
          ? `https://drive.google.com/uc?export=download&id=${matchingSubtitle.id}`
          : "",
        title: title,
        artist: artist,
        folder: "Google Drive",
        fileId: fileId,
      };
    });

    console.log(`Processed ${videos.length} videos with metadata`);

    const folders = Array.from(
      new Set(videos.map((video) => video.folder).filter(Boolean))
    );

    return new Response(JSON.stringify({ 
      videos, 
      folders,
      debug: {
        totalFiles: files.length,
        videoFiles: videoFiles.length,
        subtitleFiles: subtitleFiles.length,
        processedVideos: videos.length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in Google Drive API:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch videos from Google Drive",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
