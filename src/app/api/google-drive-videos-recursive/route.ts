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

interface FileInfo {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  folderPath?: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const API_KEY =
      searchParams.get("apiKey") || process.env.GOOGLE_DRIVE_API_KEY;
    const FOLDER_ID =
      searchParams.get("folderId") || process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log("Recursive API Request received:", {
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
    const folderMap = new Map<
      string,
      { name: string; parent: string | null }
    >();

    const getAllFolders = async (
      folderId: string,
      parentPath: string = ""
    ): Promise<void> => {
      const folderResponse = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name, parents)",
        pageSize: 1000,
      });

      const folders = folderResponse.data.files || [];

      for (const folder of folders) {
        if (folder.id) {
          const folderName = folder.name || "Unknown Folder";
          const path = parentPath ? `${parentPath}/${folderName}` : folderName;

          folderMap.set(folder.id, {
            name: folderName,
            parent: folderId !== FOLDER_ID ? folderId : null,
          });

          await getAllFolders(folder.id, path);
        }
      }
    };

    await getAllFolders(FOLDER_ID);

    const buildFolderPath = (folderId: string | null): string => {
      if (!folderId || folderId === FOLDER_ID) return "Root";

      const parts = [];
      let currentId: string | null = folderId;

      while (currentId && currentId !== FOLDER_ID) {
        const folder = folderMap.get(currentId);
        if (folder) {
          parts.unshift(folder.name);
          currentId = folder.parent;
        } else {
          break;
        }
      }

      return parts.join("/") || "Root";
    };

    const getAllFiles = async (): Promise<FileInfo[]> => {
      const allFiles: FileInfo[] = [];
      const query = `'${FOLDER_ID}' in parents and (mimeType contains 'video/' or name contains '.vtt' or name contains '.srt') and trashed = false`;

      let nextPageToken: string | undefined | null = undefined;
      do {
        const fileResponse: any = await drive.files.list({
          q: query,
          fields: "nextPageToken, files(id, name, mimeType, parents)",
          pageSize: 1000,
          pageToken: nextPageToken || undefined,
        });

        const files = fileResponse.data.files || [];
        allFiles.push(...(files as FileInfo[]));
        nextPageToken = fileResponse.data.nextPageToken;
      } while (nextPageToken);

      for (const folderId of folderMap.keys()) {
        let folderNextPageToken: string | undefined | null = undefined;
        do {
          const folderQuery = `'${folderId}' in parents and (mimeType contains 'video/' or name contains '.vtt' or name contains '.srt') and trashed = false`;

          const folderResponse: any = await drive.files.list({
            q: folderQuery,
            fields: "nextPageToken, files(id, name, mimeType, parents)",
            pageSize: 1000,
            pageToken: folderNextPageToken || undefined,
          });

          const folderFiles = folderResponse.data.files || [];
          const filesWithPath = folderFiles.map((file: any) => ({
            ...file,
            folderPath: buildFolderPath(folderId),
          })) as FileInfo[];

          allFiles.push(...filesWithPath);
          folderNextPageToken = folderResponse.data.nextPageToken;
        } while (folderNextPageToken);
      }

      return allFiles;
    };

    const allFiles = await getAllFiles();
    const videoFiles = allFiles.filter((file) =>
      file.mimeType?.includes("video/")
    );
    const subtitleFiles = allFiles.filter(
      (file) =>
        file.name?.toLowerCase().endsWith(".vtt") ||
        file.name?.toLowerCase().endsWith(".srt")
    );

    function getBestSubtitleMatch(
      videoName: string,
      subtitles: FileInfo[]
    ): FileInfo | null {
      const videoNameNoExt = videoName.replace(/\.[^/.]+$/, "").toLowerCase();

      const exactMatch = subtitles.find(
        (sub) =>
          sub.name.replace(/\.[^/.]+$/, "").toLowerCase() === videoNameNoExt
      );

      if (exactMatch) return exactMatch;

      const containsMatch = subtitles.find(
        (sub) =>
          sub.name.toLowerCase().includes(videoNameNoExt) ||
          videoNameNoExt.includes(
            sub.name.toLowerCase().replace(/\.[^/.]+$/, "")
          )
      );

      if (containsMatch) return containsMatch;
      return null;
    }

    const videos: VideoWithSubtitle[] = videoFiles.map((videoFile) => {
      const videoName = videoFile.name || "Unnamed video";
      const folderPath = videoFile.folderPath || "Root";
      const matchingSubtitle = getBestSubtitleMatch(videoName, subtitleFiles);

      let artist = "";
      let title = videoName.replace(/\.[^/.]+$/, "");

      if (videoName.includes(" - ")) {
        const parts = videoName.split(" - ");
        artist = parts[0];
        title = parts[1]?.replace(/\.[^/.]+$/, "") || title;
      }
      const fileId = videoFile.id || "";

      return {
        video: `https://drive.google.com/uc?export=view&id=${fileId}`,
        videoEmbed: `https://drive.google.com/file/d/${fileId}/preview`,
        videoDownload: `https://drive.google.com/uc?export=download&id=${fileId}`,
        subtitle: matchingSubtitle
          ? `https://drive.google.com/uc?export=download&id=${matchingSubtitle.id}`
          : "",
        title: title,
        artist: artist,
        folder: folderPath,
        fileId: fileId,
      };
    });

    const folders = Array.from(
      new Set(videos.map((video) => video.folder).filter(Boolean))
    );

    return new Response(JSON.stringify({ videos, folders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in Google Drive Recursive API:", error);
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
