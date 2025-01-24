import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const videosDirectory = path.join(
    process.cwd(),
    "public",
    "Videos",
    "videos_mkx_embedsub"
  );
  try {
    const files = fs.readdirSync(videosDirectory);
    const videoFiles = files.filter((file) => file.endsWith(".mp4"));
    console.log("Video Files:", videoFiles); // Debugging log
    return NextResponse.json({ videos: videoFiles });
  } catch (error) {
    console.error("Error reading video files:", error);
    return NextResponse.json(
      { error: "Unable to fetch video files" },
      { status: 500 }
    );
  }
}
