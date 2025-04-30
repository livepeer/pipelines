import { Storage } from "@google-cloud/storage";
import { gcpConfig } from "../serverEnv";

let storage: Storage;

try {
  if (gcpConfig.credentials) {
    const credentials = JSON.parse(gcpConfig.credentials);
    storage = new Storage({ credentials });
  } else {
    storage = new Storage();
  }
} catch (error) {
  console.error("Failed to initialize GCP Storage:", error);
  throw new Error("Failed to initialize GCP Storage");
}

const bucketName = gcpConfig.bucketName || "daydream-clips";

export async function uploadToGCS(
  file: Buffer | NodeJS.ReadableStream,
  path: string,
  contentType: string,
): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(path);

  try {
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType,
    });

    return new Promise((resolve, reject) => {
      blobStream.on("error", error => {
        reject(error);
      });

      blobStream.on("finish", async () => {
        await blob.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${path}`;
        resolve(publicUrl);
      });

      if (Buffer.isBuffer(file)) {
        blobStream.end(file);
      } else {
        file.pipe(blobStream);
      }
    });
  } catch (error) {
    console.error("Error uploading to GCS:", error);
    throw new Error("Failed to upload file to Google Cloud Storage");
  }
}

export function buildClipPath(
  userId: string,
  clipId: string | number,
  filename: string = "clip.mp4",
): string {
  const id = clipId;

  return `clips/${userId}/${id}/${filename}`;
}

function buildThumbnailPath(userId: string, clipId: string | number): string {
  return `clips/${userId}/${clipId}/thumbnail.jpg`;
}

export function buildThumbnailUrl(
  userId: string,
  clipId: string | number,
): string {
  return `https://storage.googleapis.com/${bucketName}/${buildThumbnailPath(
    userId,
    clipId,
  )}`;
}

export async function deleteFromGCS(path: string): Promise<void> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  try {
    await file.delete();
  } catch (error) {
    console.error("Error deleting file from GCS:", error);
    throw new Error("Failed to delete file from Google Cloud Storage");
  }
}

export async function getSignedUploadUrl(
  path: string,
  contentType: string,
  expiresIn: number = 15 * 60, // 15 minutes
): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresIn * 1000,
    contentType,
  });

  return url;
}
