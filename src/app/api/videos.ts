import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const videosDirectory = path.join(
    process.cwd(),
    "public/Videos/videos_mkv_embedsub"
  );
  try {
    const files = fs.readdirSync(videosDirectory);
    const videoFiles = files.filter((file) => file.endsWith(".mkv"));
    res.status(200).json({ videos: videoFiles });
  } catch (error) {
    console.error("Error reading video files:", error);
    res.status(500).json({ error: "Unable to fetch video files" });
  }
}
