import * as functions from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

const FFMPEG_COMMAND = "ffmpeg";

const storage = new Storage();

interface GcsEvent {
  bucket: string;
  name: string;
  metageneration: string;
  timeCreated: string;
  updated: string;
  contentType?: string;
}

functions.cloudEvent(
  "generateThumbnail",
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

    const parsedPath = path.parse(fileName);
    const baseName = parsedPath.base;
    const baseNameWithoutExt = parsedPath.name;
    const originalDir = parsedPath.dir;

    const tempVideoPath = path.join(os.tmpdir(), baseName);
    const tempThumbnailPath = path.join(
      os.tmpdir(),
      `${baseNameWithoutExt}.jpg`,
    );

    const sourceBucket = storage.bucket(bucketName);
    const sourceFile = sourceBucket.file(fileName);

    const thumbnailBucket = storage.bucket(bucketName);

    const thumbnailBlobName = path.join(
      originalDir,
      `${baseNameWithoutExt}.jpg`,
    );

    try {
      console.log(
        `Downloading gs://${bucketName}/${fileName} to ${tempVideoPath}...`,
      );
      await sourceFile.download({ destination: tempVideoPath });
      console.log("Download complete.");

      console.log(`Running FFmpeg command for ${tempVideoPath}...`);
      await new Promise<void>((resolve, reject) => {
        const ffmpegProcess = spawn(FFMPEG_COMMAND, [
          "-i",
          tempVideoPath,
          "-ss",
          "00:00:01.000",
          "-vframes",
          "1",
          "-y",
          "-q:v",
          "3",
          tempThumbnailPath,
        ]);

        let stderr = "";
        ffmpegProcess.stdout.on("data", data =>
          console.log(`FFmpeg stdout: ${data}`),
        );
        ffmpegProcess.stderr.on("data", data => {
          console.error(`FFmpeg stderr: ${data}`);
          stderr += data;
        });

        ffmpegProcess.on("close", code => {
          if (code === 0) {
            console.log("FFmpeg execution successful.");
            resolve();
          } else {
            console.error(`FFmpeg process exited with code ${code}`);
            reject(new Error(`FFmpeg failed: ${stderr}`));
          }
        });

        ffmpegProcess.on("error", err => {
          console.error("Failed to start FFmpeg process.", err);
          reject(err);
        });
      });

      console.log(
        `Uploading thumbnail to gs://${bucketName}/${thumbnailBlobName}...`,
      );
      await thumbnailBucket.upload(tempThumbnailPath, {
        destination: thumbnailBlobName,
        metadata: {
          contentType: "image/jpeg",
          cacheControl: "public, max-age=3600",
        },
      });
      console.log("Thumbnail upload complete.");
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    } finally {
      try {
        await fs.unlink(tempVideoPath);
        console.log(`Removed temporary video file: ${tempVideoPath}`);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(
            `Could not remove temp video file ${tempVideoPath}: ${e}`,
          );
        }
      }
      try {
        await fs.unlink(tempThumbnailPath);
        console.log(`Removed temporary thumbnail file: ${tempThumbnailPath}`);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(
            `Could not remove temp thumbnail file ${tempThumbnailPath}: ${e}`,
          );
        }
      }
    }
  },
);
