import * as functions from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

const FFMPEG_COMMAND = "ffmpeg";
const FONT_PATH = "/usr/share/fonts/truetype/freefont/FreeSans.ttf";

const storage = new Storage();

interface GcsEvent {
  bucket: string;
  name: string;
  metageneration: string;
  timeCreated: string;
  updated: string;
  contentType?: string;
}

const runFFmpeg = (args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Running FFmpeg with args: ${args.join(" ")}`);
    const ffmpegProcess = spawn(FFMPEG_COMMAND, args);

    let stdout = "";
    let stderr = "";

    ffmpegProcess.stdout.on("data", data => {
      stdout += data;
    });
    ffmpegProcess.stderr.on("data", data => {
      console.error(`FFmpeg stderr: ${data}`);
      stderr += data;
    });

    ffmpegProcess.on("close", code => {
      if (code === 0) {
        console.log("FFmpeg execution successful.");
        resolve(stdout);
      } else {
        console.error(`FFmpeg process exited with code ${code}`);
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpegProcess.on("error", err => {
      console.error("Failed to start FFmpeg process.", err);
      reject(err);
    });
  });
};

functions.cloudEvent(
  "postprocessClips",
  async (cloudEvent: functions.CloudEvent<GcsEvent>) => {
    const file = cloudEvent.data;
    if (!file) {
      console.error("No data received in event");
      return;
    }

    const bucketName = file.bucket;
    const fileName = file.name;
    const contentType = file.contentType || "";

    console.log(`Processing file: ${fileName} in bucket: ${bucketName}.`);

    const videoExtensions = [".mp4", ".mov", ".avi", ".wmv", ".mkv"];
    const isVideo =
      videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext)) ||
      contentType.startsWith("video/");

    if (!isVideo) {
      console.log(`File ${fileName} is not a video. Skipping.`);
      return;
    }

    const parsedPath = path.parse(fileName); // { dir: 'videos', base: 'myclip.mp4', ext: '.mp4', name: 'myclip' }
    const baseName = parsedPath.base; // 'myclip.mp4'
    const baseNameWithoutExt = parsedPath.name; // 'myclip'
    const originalDir = parsedPath.dir; // 'videos'
    const originalExt = parsedPath.ext; // '.mp4'

    if (baseNameWithoutExt.endsWith("-watermark")) {
      console.log(
        `File ${fileName} seems to be already watermarked. Skipping to prevent loop.`,
      );
      return;
    }

    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(tempDir, baseName);
    const tempThumbnailPath = path.join(tempDir, `${baseNameWithoutExt}.jpg`);
    const tempWatermarkedVideoPath = path.join(
      tempDir,
      `${baseNameWithoutExt}-watermark${originalExt}`,
    );

    const sourceBucket = storage.bucket(bucketName);
    const sourceFile = sourceBucket.file(fileName);

    const thumbnailBlobName = path.join(
      originalDir,
      `${baseNameWithoutExt}.jpg`,
    );

    const watermarkedVideoBlobName = path.join(
      originalDir, // 'videos'
      `${baseNameWithoutExt}-watermark${originalExt}`,
    );

    try {
      console.log(
        `Downloading gs://${bucketName}/${fileName} to ${tempVideoPath}...`,
      );
      await sourceFile.download({ destination: tempVideoPath });
      console.log("Download complete.");

      console.log(`Generating thumbnail for ${tempVideoPath}...`);
      const thumbnailArgs = [
        "-i",
        tempVideoPath,
        "-ss",
        "00:00:01.000",
        "-vframes",
        "1",
        "-vf",
        "scale=320:-1",
        "-q:v",
        "3",
        "-y",
        tempThumbnailPath,
      ];
      await runFFmpeg(thumbnailArgs);
      console.log("Thumbnail generation complete.");

      console.log(`Generating watermarked video for ${tempVideoPath}...`);
      const watermarkText = "daydream.live";
      const margin = 16;
      const bottomMargin = 8;
      const fontSize = 12;
      const boxPadding = 4;

      const drawtextFilter = [
        `drawtext=text='${watermarkText}'`,
        `fontfile=${FONT_PATH}`,
        `fontsize=${fontSize}`,
        `fontcolor=white`,
        `x=${margin}`,
        `y=h-line_h-${bottomMargin}`,
        `box=1`,
        `boxcolor=black@0.4`,
        `boxborderw=${boxPadding}`,
      ].join(":");

      const watermarkArgs = [
        "-i",
        tempVideoPath,
        "-vf",
        drawtextFilter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        tempWatermarkedVideoPath,
      ];
      await runFFmpeg(watermarkArgs);
      console.log("Watermarked video generation complete.");

      console.log(
        `Uploading thumbnail to gs://${bucketName}/${thumbnailBlobName}...`,
      );
      await sourceBucket.upload(tempThumbnailPath, {
        destination: thumbnailBlobName,
        metadata: {
          contentType: "image/jpeg",
          cacheControl: "public, max-age=3600",
        },
      });
      console.log("Thumbnail upload complete.");

      console.log(
        `Uploading watermarked video to gs://${bucketName}/${watermarkedVideoBlobName}...`,
      );
      await sourceBucket.upload(tempWatermarkedVideoPath, {
        destination: watermarkedVideoBlobName,
        metadata: {
          contentType: contentType,
          cacheControl: "public, max-age=3600",
        },
      });
      console.log("Watermarked video upload complete.");
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    } finally {
      console.log("Cleaning up temporary files...");
      const filesToUnlink = [
        tempVideoPath,
        tempThumbnailPath,
        tempWatermarkedVideoPath,
      ];
      for (const tempPath of filesToUnlink) {
        try {
          await fs.unlink(tempPath);
          console.log(`Removed temporary file: ${tempPath}`);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
            console.warn(`Could not remove temp file ${tempPath}: ${e}`);
          }
        }
      }
      console.log("Cleanup complete.");
    }
  },
);
