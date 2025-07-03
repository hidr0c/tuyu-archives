import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";

interface Video {
  video: string;
  subtitle: string;
  title?: string;
  artist?: string;
  folder: string;
}

export async function GET(req: NextRequest) {
  try {
    const videosDirectory = path.join(process.cwd(), "public/Videos/videosxd");

    let videoFiles: Video[] = [];
    try {
      const files = fs.readdirSync(videosDirectory);
      videoFiles = files
        .filter((file) => file.endsWith(".webm"))
        .map((file) => {
          // Parse title and artist from filename
          const nameWithoutExt = file.replace(".webm", "").replace(/_/g, " ");
          const parts = nameWithoutExt.split(" - ");

          let title = nameWithoutExt;
          let artist = undefined;

          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(" - ").trim();
          }

          return {
            video: `/Videos/videosxd/${encodeURIComponent(file)}`,
            subtitle: `/Videos/videosxd/${encodeURIComponent(
              file.replace(".webm", ".vtt")
            )}`,
            title,
            artist,
            folder: "Local Videos",
          };
        });
    } catch (error) {
      console.error("Error reading video files:", error);
    }

    return new Response(
      JSON.stringify({
        videos: videoFiles,
        count: videoFiles.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in videos API:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
