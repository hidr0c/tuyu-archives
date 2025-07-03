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

interface FolderInfo {
  id: string;
  name: string;
  path: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get API key and folder ID from query parameters or environment variables
    let API_KEY = searchParams.get("apiKey");
    let FOLDER_ID = searchParams.get("folderId");

    // If not provided in query params, use environment variables
    if (!API_KEY) {
      API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "";
      console.log("Using API key from environment variable");
    } else {
      console.log("Using API key from query parameter");
    }

    if (!FOLDER_ID) {
      FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
      console.log("Using folder ID from environment variable");
    } else {
      console.log("Using folder ID from query parameter");
    }

    console.log("Recursive API Request received:", {
      hasApiKey: !!API_KEY,
      apiKeyLength: API_KEY?.length || 0,
      hasFolderId: !!FOLDER_ID,
      folderIdLength: FOLDER_ID?.length || 0,
      envApiKeyAvailable: !!process.env.GOOGLE_DRIVE_API_KEY,
      envFolderIdAvailable: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    });

    if (!API_KEY || !FOLDER_ID) {
      console.error("Missing API configuration:", {
        API_KEY: !!API_KEY,
        FOLDER_ID: !!FOLDER_ID,
      });
      return new Response(
        JSON.stringify({
          error:
            "Missing Google Drive API configuration. Please check your environment variables.",
          debug: {
            hasApiKey: !!API_KEY,
            hasFolderId: !!FOLDER_ID,
            envApiKey: !!process.env.GOOGLE_DRIVE_API_KEY,
            envFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const drive = google.drive({ version: "v3", auth: API_KEY });

    // Get root folder info
    const rootFolderResponse = await drive.files.get({
      fileId: FOLDER_ID,
      fields: "name,id,mimeType",
    });

    const rootFolderName = rootFolderResponse.data.name || "Root";
    console.log(`Root folder name: ${rootFolderName}`);

    // First, find all folders (recursive)
    const allFolders: FolderInfo[] = [
      { id: FOLDER_ID, name: rootFolderName, path: rootFolderName },
    ];

    const processedFolders = new Set<string>();
    processedFolders.add(FOLDER_ID);

    async function processFolder(folderId: string, folderPath: string) {
      try {
        console.log(`Processing folder: ${folderPath} (${folderId})`);

        const response = await drive.files.list({
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: "files(id, name, mimeType)",
          pageSize: 100,
        });

        const subfolders = response.data.files || [];
        console.log(`Found ${subfolders.length} subfolders in "${folderPath}"`);

        for (const folder of subfolders) {
          if (folder.id && !processedFolders.has(folder.id)) {
            const newPath = `${folderPath}/${folder.name}`;
            allFolders.push({
              id: folder.id,
              name: folder.name || "Unknown",
              path: newPath,
            });
            processedFolders.add(folder.id);

            // Process this subfolder recursively
            await processFolder(folder.id, newPath);
          }
        }
      } catch (error: any) {
        console.error(`Error processing folder ${folderId}:`, error.message);
      }
    }

    // Start recursive folder processing
    await processFolder(FOLDER_ID, rootFolderName);
    console.log(`Found ${allFolders.length} total folders`);

    // Now find all videos and subtitles in all folders
    const allVideos: VideoWithSubtitle[] = [];
    const allFiles = new Map<
      string,
      {
        id: string;
        name: string;
        mimeType: string;
        folderPath: string;
      }
    >();

    for (const folder of allFolders) {
      try {
        console.log(`Getting files from folder: ${folder.path}`);

        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: "files(id, name, mimeType)",
          pageSize: 1000,
        });

        const files = filesResponse.data.files || [];
        console.log(`Found ${files.length} files in folder "${folder.path}"`);

        for (const file of files) {
          if (file.id && file.name && file.mimeType) {
            allFiles.set(file.id, {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              folderPath: folder.path,
            });
          }
        }
      } catch (error: any) {
        console.error(
          `Error getting files from folder ${folder.path}:`,
          error.message
        );
      }
    }

    console.log(`Found ${allFiles.size} total files in all folders`);

    // Filter for videos and subtitles
    const videoFiles = Array.from(allFiles.values()).filter((file) =>
      file.mimeType.includes("video/")
    );

    const subtitleFiles = Array.from(allFiles.values()).filter(
      (file) =>
        file.name.toLowerCase().endsWith(".vtt") ||
        file.name.toLowerCase().endsWith(".srt")
    );

    console.log(
      `Found ${videoFiles.length} videos and ${subtitleFiles.length} subtitles`
    );

    // Create video objects with metadata
    videoFiles.forEach((videoFile) => {
      const videoName = videoFile.name.replace(/\.[^/.]+$/, "") || "";
      const folderPath = videoFile.folderPath;

      // Find matching subtitle
      const matchingSubtitle = subtitleFiles.find((subFile) => {
        const subtitleName = subFile.name.replace(/\.[^/.]+$/, "") || "";
        return (
          subtitleName.toLowerCase() === videoName.toLowerCase() ||
          subtitleName.includes(videoName) ||
          videoName.includes(subtitleName)
        );
      });

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

      allVideos.push({
        video: `https://drive.google.com/uc?export=view&id=${videoFile.id}`,
        videoEmbed: `https://drive.google.com/file/d/${videoFile.id}/preview`,
        subtitle: matchingSubtitle
          ? `https://drive.google.com/uc?export=download&id=${matchingSubtitle.id}`
          : "",
        title,
        artist,
        folder: folderPath,
        fileId: videoFile.id,
      });
    });

    console.log(`Processed ${allVideos.length} videos with metadata`);

    // Get unique folders
    const folders = Array.from(
      new Set(allVideos.map((video) => video.folder).filter(Boolean))
    );

    return new Response(
      JSON.stringify({
        videos: allVideos,
        folders,
        debug: {
          totalFolders: allFolders.length,
          totalFiles: allFiles.size,
          videoFiles: videoFiles.length,
          subtitleFiles: subtitleFiles.length,
          processedVideos: allVideos.length,
          folderPaths: allFolders.map((f) => f.path),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in Google Drive API:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch videos from Google Drive",
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
