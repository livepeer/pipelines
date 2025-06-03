"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePublicFromfileUrl = makePublicFromfileUrl;
exports.getPublicUrl = getPublicUrl;
exports.uploadToGCS = uploadToGCS;
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
exports.buildFilePath = buildFilePath;
exports.deleteFromGCS = deleteFromGCS;
const storage_1 = require("@google-cloud/storage");
const serverEnv_1 = require("../serverEnv");
let storage;
try {
  if (serverEnv_1.gcpConfig.credentials) {
    try {
      const credentials = JSON.parse(serverEnv_1.gcpConfig.credentials);
      storage = new storage_1.Storage({ credentials });
    } catch (parseError) {
      storage = new storage_1.Storage();
    }
  } else {
    storage = new storage_1.Storage();
  }
} catch (error) {
  console.error("Failed to initialize GCP Storage:", error);
  throw new Error("Failed to initialize GCP Storage", { cause: error });
}
const bucketName = serverEnv_1.gcpConfig.bucketName || "daydream-clips";
async function makePublicFromfileUrl(filePath) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath.split(`${bucketName}/`)[1]);
  await file.makePublic();
}
function getPublicUrl(path) {
  return `https://storage.googleapis.com/${bucketName}/${path}`;
}
async function uploadToGCS(file, path, contentType) {
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
async function generatePresignedUploadUrl(
  path,
  contentType,
  expiresInMinutes = 15,
) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  const options = {
    version: "v4",
    action: "write",
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
function buildFilePath(userId, clipId, filename) {
  return `clips/${userId}/${String(clipId)}/${filename}`;
}
async function deleteFromGCS(path) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(path);
  try {
    await file.delete();
  } catch (error) {
    console.error("Error deleting file from GCS:", error);
    throw new Error("Failed to delete file from Google Cloud Storage");
  }
}
