import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";
import { gcpConfig } from "../serverEnv";

let storage: Storage;

try {
  if (gcpConfig.credentials) {
    try {
      const credentials = JSON.parse(gcpConfig.credentials);
      storage = new Storage({ credentials });
    } catch (parseError) {
      storage = new Storage();
    }
  } else {
    storage = new Storage();
  }
} catch (error) {
  console.error("Failed to initialize GCP Storage:", error);
  throw new Error("Failed to initialize GCP Storage", { cause: error });
}

const bucketName = gcpConfig.bucketName || "daydream-clips";

export async function makePublicFromfileUrl(filePath: string) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath.split(`${bucketName}/`)[1]!);
  await file.makePublic();
}

export function getPublicUrl(path: string): string {
  return `https://storage.googleapis.com/${bucketName}/${path}`;
}

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

export async function generatePresignedUploadUrl(
  path: string,
  contentType: string,
  expiresInMinutes: number = 15,
): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);

  const options: GetSignedUrlConfig = {
    version: "v4" as "v4",
    action: "write" as "write",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType,
  };

  try {
    const [signedUrl] = await file.getSignedUrl(options);
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned upload URL");
  }
}

export function buildFilePath(
  userId: string,
  clipId: string | number,
  filename: string,
) {
  return `clips/${userId}/${String(clipId)}/${filename}`;
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
