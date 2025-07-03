import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const API_KEY =
      searchParams.get("apiKey") || process.env.GOOGLE_DRIVE_API_KEY;
    const FOLDER_ID =
      searchParams.get("folderId") || process.env.GOOGLE_DRIVE_FOLDER_ID;

    return new Response(
      JSON.stringify({
        debug: {
          environment: {
            NODE_ENV: process.env.NODE_ENV,
            hasServerApiKey: !!process.env.GOOGLE_DRIVE_API_KEY,
            hasServerFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
            serverApiKeyLength: process.env.GOOGLE_DRIVE_API_KEY?.length || 0,
            serverFolderIdLength:
              process.env.GOOGLE_DRIVE_FOLDER_ID?.length || 0,
          },
          request: {
            hasQueryApiKey: !!searchParams.get("apiKey"),
            hasQueryFolderId: !!searchParams.get("folderId"),
            queryApiKeyLength: searchParams.get("apiKey")?.length || 0,
            queryFolderIdLength: searchParams.get("folderId")?.length || 0,
          },
          resolved: {
            hasApiKey: !!API_KEY,
            hasFolderId: !!FOLDER_ID,
            apiKeyLength: API_KEY?.length || 0,
            folderIdLength: FOLDER_ID?.length || 0,
            apiKeySource: searchParams.get("apiKey") ? "query" : "env",
            folderIdSource: searchParams.get("folderId") ? "query" : "env",
          },
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message || "Debug endpoint error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
