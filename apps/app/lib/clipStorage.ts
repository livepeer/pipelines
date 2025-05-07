import { ClipRecordingMode } from "@/components/daydream/Clipping/ClipOptionsModal";

// IndexedDB storage for clips
const DB_NAME = "daydream_clip_storage";
const DB_VERSION = 1;
const STORE_NAME = "pending_clips";

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    console.log(
      `Attempting to open IndexedDB: ${DB_NAME} version ${DB_VERSION}`,
    );
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      console.log("IndexedDB upgrade needed.");
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log(`Creating object store: ${STORE_NAME}`);
        db.createObjectStore(STORE_NAME);
      } else {
        console.log(`Object store ${STORE_NAME} already exists.`);
      }
    };

    request.onsuccess = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`IndexedDB ${DB_NAME} opened successfully.`);
      resolve(db);
    };

    request.onerror = event => {
      const reqError = (event.target as IDBOpenDBRequest).error;
      console.error("Failed to open IndexedDB:", reqError);
      reject(reqError);
    };
  });
};

const ensureBlobType = (blob: Blob, defaultType: string): Blob => {
  if (blob.type) {
    return blob;
  }
  console.warn(`Blob type missing, applying default: ${defaultType}`);
  return new Blob([blob], { type: defaultType });
};

export const storeClip = async (
  clipBlob: Blob,
  filename: string,
  thumbnailBlob: Blob,
  prompt?: string,
  recordingMode?: string,
): Promise<void> => {
  console.log(`Attempting to store clip: ${filename}`);
  try {
    const db = await initDB();
    console.log("DB obtained for storing clip.");

    const videoType = clipBlob.type || "video/mp4";
    const thumbType = thumbnailBlob.type || "image/jpeg";
    console.log(`Using video type: ${videoType}, thumbnail type: ${thumbType}`);

    const typedClipBlob = ensureBlobType(clipBlob, videoType);
    const typedThumbnailBlob = ensureBlobType(thumbnailBlob, thumbType);

    console.log("Converting blobs to ArrayBuffers...");
    const clipBuffer = await typedClipBlob.arrayBuffer();
    const thumbnailBuffer = await typedThumbnailBlob.arrayBuffer();
    console.log("Blobs converted to ArrayBuffers successfully.");

    return new Promise((resolve, reject) => {
      console.log(`Starting IndexedDB transaction to store clip: ${filename}`);
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const clipData = {
        clipBuffer: clipBuffer,
        blobType: videoType,
        filename: filename,
        thumbnailBuffer: thumbnailBuffer,
        thumbnailType: thumbType,
        prompt: prompt || "",
        timestamp: Date.now(),
        recordingMode: recordingMode || "output-only",
      };

      console.log(`Putting clip data into store with key: pendingClip`);
      const request = store.put(clipData, "pendingClip");

      request.onsuccess = () => {
        console.log(
          `Clip data for ${filename} stored successfully in IndexedDB.`,
        );
        localStorage.setItem("daydream_has_pending_clip", "true");
        localStorage.setItem("daydream_pending_clip_type", videoType);
        console.log(
          "Set localStorage flags: daydream_has_pending_clip=true, daydream_pending_clip_type=" +
            videoType,
        );

        if (prompt) {
          localStorage.setItem("daydream_pending_clip_prompt", prompt);
          console.log("Set localStorage flag: daydream_pending_clip_prompt");
        } else {
          localStorage.removeItem("daydream_pending_clip_prompt");
          console.log(
            "Removed localStorage flag: daydream_pending_clip_prompt",
          );
        }

        resolve();
      };

      request.onerror = () => {
        const reqError = request.error;
        console.error(
          `Error putting data into IndexedDB store for ${filename}:`,
          reqError,
        );
        reject(reqError);
      };

      transaction.oncomplete = () => {
        console.log(
          `Store transaction completed for ${filename}. Closing DB connection.`,
        );
        db.close();
      };

      transaction.onerror = event => {
        const transError = (event.target as IDBTransaction).error;
        console.error(`Store transaction error for ${filename}:`, transError);
      };
    });
  } catch (error) {
    console.error(`Error storing clip ${filename} in IndexedDB:`, error);
    throw error;
  }
};

export const retrieveClip = async (): Promise<{
  blob: Blob;
  filename: string;
  thumbnail: Blob;
  prompt: string;
  recordingMode: ClipRecordingMode;
} | null> => {
  console.log("Attempting to retrieve clip from storage.");
  try {
    const hasPendingClip = localStorage.getItem("daydream_has_pending_clip");
    if (hasPendingClip !== "true") {
      console.log(
        "No pending clip flag found in localStorage. No clip to retrieve.",
      );
      return null;
    }
    console.log(
      "Pending clip flag found in localStorage. Proceeding with IndexedDB retrieval.",
    );

    const db = await initDB();
    console.log("DB obtained for retrieving clip.");

    return new Promise((resolve, reject) => {
      console.log("Starting IndexedDB transaction to retrieve clip.");
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      console.log(`Getting clip data from store with key: pendingClip`);
      const request = store.get("pendingClip");

      request.onsuccess = () => {
        const clipData = request.result;
        console.log("IndexedDB get request successful.");

        if (!clipData || !clipData.clipBuffer || !clipData.thumbnailBuffer) {
          console.warn(
            "Retrieved data from IndexedDB is missing key properties (clipBuffer or thumbnailBuffer). Cleaning up localStorage.",
            clipData,
          );
          localStorage.removeItem("daydream_has_pending_clip");
          localStorage.removeItem("daydream_pending_clip_prompt");
          localStorage.removeItem("daydream_pending_clip_type");
          console.log("Cleaned up localStorage due to incomplete data.");
          resolve(null);
          return;
        }

        console.log(`Retrieved clip data for filename: ${clipData.filename}`);
        const videoType =
          clipData.blobType ||
          localStorage.getItem("daydream_pending_clip_type") ||
          "video/mp4";
        const thumbType = clipData.thumbnailType || "image/jpeg";
        console.log(
          `Determined video type: ${videoType}, thumbnail type: ${thumbType}`,
        );

        try {
          console.log("Reconstructing Blobs from ArrayBuffers...");
          const reconstructedClipBlob = new Blob([clipData.clipBuffer], {
            type: videoType,
          });
          const reconstructedThumbnailBlob = new Blob(
            [clipData.thumbnailBuffer],
            { type: thumbType },
          );

          console.log(
            `Clip data for ${clipData.filename} retrieved and Blobs reconstructed successfully.`,
          );
          resolve({
            blob: reconstructedClipBlob,
            filename: clipData.filename,
            thumbnail: reconstructedThumbnailBlob,
            prompt: clipData.prompt || "",
            recordingMode: clipData.recordingMode || "output-only",
          });
        } catch (reconstructionError) {
          console.error(
            "Error reconstructing Blobs from ArrayBuffers:",
            reconstructionError,
          );
          localStorage.removeItem("daydream_has_pending_clip");
          localStorage.removeItem("daydream_pending_clip_prompt");
          localStorage.removeItem("daydream_pending_clip_type");
          console.log("Cleaned up localStorage due to reconstruction error.");
          reject(reconstructionError);
        }
      };

      request.onerror = () => {
        const reqError = request.error;
        console.error("Failed to retrieve data from IndexedDB:", reqError);
        localStorage.removeItem("daydream_has_pending_clip");
        localStorage.removeItem("daydream_pending_clip_prompt");
        localStorage.removeItem("daydream_pending_clip_type");
        console.log("Cleaned up localStorage due to IndexedDB get error.");
        reject(reqError);
      };

      transaction.oncomplete = () => {
        console.log("Retrieve transaction completed. Closing DB connection.");
        db.close();
      };

      transaction.onerror = event => {
        const transError = (event.target as IDBTransaction).error;
        console.error("Retrieve transaction error:", transError);
      };
    });
  } catch (error) {
    console.error("Top-level error retrieving clip from IndexedDB:", error);
    localStorage.removeItem("daydream_has_pending_clip");
    localStorage.removeItem("daydream_pending_clip_prompt");
    localStorage.removeItem("daydream_pending_clip_type");
    console.log("Cleaned up localStorage due to top-level retrieval error.");
    return null;
  }
};

export const deleteClip = async (): Promise<void> => {
  console.log("Attempting to delete pending clip from storage.");
  try {
    const db = await initDB();
    console.log("DB obtained for deleting clip.");

    return new Promise((resolve, reject) => {
      console.log("Starting IndexedDB transaction to delete clip.");
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      console.log(`Deleting item from store with key: pendingClip`);
      const request = store.delete("pendingClip");

      request.onsuccess = () => {
        console.log("Successfully deleted clip data from IndexedDB store.");
        localStorage.removeItem("daydream_has_pending_clip");
        localStorage.removeItem("daydream_pending_clip_prompt");
        localStorage.removeItem("daydream_pending_clip_type");
        console.log("Removed associated localStorage flags.");
        resolve();
      };

      request.onerror = () => {
        const reqError = request.error;
        console.error("Error deleting data from IndexedDB store:", reqError);
        reject(reqError);
      };

      transaction.oncomplete = () => {
        console.log("Delete transaction completed. Closing DB connection.");
        db.close();
      };

      transaction.onerror = event => {
        const transError = (event.target as IDBTransaction).error;
        console.error("Delete transaction error:", transError);
      };
    });
  } catch (error) {
    console.error("Error deleting clip from IndexedDB:", error);
    throw error;
  }
};
