import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { url } from "inspector";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost:3000/api/oauth2callback"
);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try{
    oauth2Client.setCredentials({
      refresh_token: '1//04k7bckhw8caQCgYIARAAGAQSNwF-L9Irenbbn1nU67KF2dHZVWMEV_lmuCG5vJ09W4c0ZxqjC10WP1oHr8PzMByGsAI-uJqnfaA',
      access_token:'ya29.a0AXeO80R6uwmaUDaXtKl4Mg32HofWGZprZM5-MwlFbQQQKm1f8NAwqdFqakt3YI3LN76FvKqSCXb_BxSomL5MmBZFK_m_0K2DxwaSo2utgCLC-zD9MUILoE0L2hHWJspRj2ro7yYXOID-deeVvgL1B1q2F1XFnb33eOsUk64_aCgYKAfESARASFQHGX2MiAVWapGMksLtUPMXzi7wR0w0175'
  });

  const drive = google.drive({version: 'v3', auth:oauth2Client});

  const response =  await drive.files.list({
    q: `'${FOLDER_ID}' in parents and (mime_type='video/mp4' or mime_type='video/mkv')`,
    fields: 'files(id, name, mimeType, webViewLink)', 
  })

  const videos = response.data.files?.map(file => ({
    name: file.name,
    url: `https://drive.google.com/uc?id=${file.id}`,
  })) || [];
  res.status(200).json({videos});
} catch (error) {
  console.error ('Error fetching videos: ', error);
  res.status(500).json({error: 'Unable to fetch video files'});
 }
}
