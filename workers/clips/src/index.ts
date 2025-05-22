import * as functions from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

const FFMPEG_COMMAND = "ffmpeg";
const FFPROBE_COMMAND = "ffprobe";
const FONT_PATH = "/usr/share/fonts/truetype/freefont/FreeSans.ttf";

const storage = new Storage();

const VIDEO_HEIGHT_TO_FONT_SIZE_RATIO = 30;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 50;

interface GcsEvent {
  bucket: string;
  name: string;
  metageneration: string;
  timeCreated: string;
  updated: string;
  contentType?: string;
}

const runCommand = (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(" ")}`);
    const process = spawn(command, args);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", data => {
      stdout += data;
    });
    process.stderr.on("data", data => {
      console.error(`${command} stderr: ${data}`);
      stderr += data;
    });

    process.on("close", code => {
      if (code === 0) {
        console.log(`${command} execution successful.`);
        resolve(stdout);
      } else {
        console.error(`${command} process exited with code ${code}`);
        reject(new Error(`${command} failed with code ${code}: ${stderr}`));
      }
    });

    process.on("error", err => {
      console.error(`Failed to start ${command} process.`, err);
      reject(err);
    });
  });
};

const getVideoHeight = async (videoPath: string): Promise<number> => {
  const args = [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=height",
    "-of",
    "csv=s=x:p=0",
    videoPath,
  ];
  try {
    const output = await runCommand(FFPROBE_COMMAND, args);
    const height = parseInt(output.trim(), 10);
    if (isNaN(height)) {
      throw new Error(
        `Failed to parse video height from ffprobe output: ${output}`,
      );
    }
    console.log(`Detected video height: ${height}`);
    return height;
  } catch (error) {
    console.error("Error getting video height:", error);
    throw error;
  }
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

    const parsedPath = path.parse(fileName);
    const baseName = parsedPath.base;
    const baseNameWithoutExt = parsedPath.name;
    const originalDir = parsedPath.dir;
    const originalExt = parsedPath.ext;

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
      originalDir,
      `${baseNameWithoutExt}-watermark${originalExt}`,
    );

    try {
      console.log(
        `Downloading gs://${bucketName}/${fileName} to ${tempVideoPath}...`,
      );
      await sourceFile.download({ destination: tempVideoPath });
      console.log("Download complete.");

      const videoHeight = await getVideoHeight(tempVideoPath);

      let dynamicFontSize = Math.round(
        videoHeight / VIDEO_HEIGHT_TO_FONT_SIZE_RATIO,
      );
      dynamicFontSize = Math.max(
        MIN_FONT_SIZE,
        Math.min(dynamicFontSize, MAX_FONT_SIZE),
      );

      const dynamicMargin = Math.round(dynamicFontSize * 1.3);
      const dynamicBottomMargin = Math.round(dynamicFontSize * 0.7);
      const dynamicBoxPadding = Math.round(dynamicFontSize * 0.3);

      console.log(
        `Calculated dynamic font size: ${dynamicFontSize}, margin: ${dynamicMargin}, bottomMargin: ${dynamicBottomMargin}, boxPadding: ${dynamicBoxPadding}`,
      );

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
      await runCommand(FFMPEG_COMMAND, thumbnailArgs);
      console.log("Thumbnail generation complete.");

      console.log(`Generating watermarked video for ${tempVideoPath}...`);
      const watermarkText = "daydream.live";

      const drawtextFilter = [
        `drawtext=text='${watermarkText}'`,
        `fontfile=${FONT_PATH}`,
        `fontsize=${dynamicFontSize}`,
        `fontcolor=white`,
        `x=${dynamicMargin}`,
        `y=h-line_h-${dynamicBottomMargin}`,
        `box=1`,
        `boxcolor=black@0.4`,
        `boxborderw=${dynamicBoxPadding}`,
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
      await runCommand(FFMPEG_COMMAND, watermarkArgs);
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