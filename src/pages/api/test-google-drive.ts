import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

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

    // Return environment check
    const envStatus = {
      serverApiKeyConfigured: !!API_KEY,
      serverFolderIdConfigured: !!FOLDER_ID,
      serverApiKeyValue: API_KEY
        ? `${API_KEY.substring(0, 3)}...${API_KEY.substring(
            API_KEY.length - 3
          )}`
        : null,
      serverFolderId: FOLDER_ID || null,
      time: new Date().toISOString(),
    };

    if (!API_KEY || !FOLDER_ID) {
      return res.status(400).json({
        error: "Missing Google Drive API configuration",
        details: "API Key or Folder ID is missing in environment variables",
        envStatus,
      });
    }

    // Test API connection
    const drive = google.drive({ version: "v3", auth: API_KEY });

    try {
      // Try to get folder info
      const folderInfo = await drive.files.get({
        fileId: FOLDER_ID,
        fields: "id,name,mimeType",
      });

      // Try to list contents
      const filesResponse = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed=false`,
        pageSize: 5,
        fields: "files(id, name, mimeType)",
      });

      return res.status(200).json({
        success: true,
        message: "Google Drive API connection successful",
        folderInfo: folderInfo.data,
        sampleFiles: filesResponse.data.files,
        envStatus,
      });
    } catch (apiError) {
      return res.status(500).json({
        error: "Google Drive API error",
        details:
          apiError instanceof Error ? apiError.message : "Unknown API error",
        envStatus,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
