import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FOLDER_ID = process.env.FOLDER_ID!;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3000/api/oauth2callback"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      access_token: process.env.GOOGLE_ACCESS_TOKEN!,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (mimeType='video/mp4' or mimeType='video/mkv')`,
      fields: "files(id, name, mimeType, webViewLink)",
    });

    const videos =
      response.data.files?.map((file) => ({
        name: file.name!,
        url: `https://drive.google.com/uc?id=${file.id}`,
      })) || [];

    console.log("Video Files:", videos); // Optional: For debugging
    console.log("Fetched Files:", response.data.files);
    console.log("Mapped Videos:", videos);

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Error fetching videos: ", error);
    res.status(500).json({ error: "Unable to fetch video files" });
  }
}
