// IndexedDB storage for clips
const DB_NAME = "daydream_clip_storage";
const DB_VERSION = 1;
const STORE_NAME = "pending_clips";

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = event => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = event => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const ensureBlobType = (blob: Blob, defaultType: string): Blob => {
  if (blob.type) {
    return blob;
  }

  return new Blob([blob], { type: defaultType });
};

export const storeClip = async (
  clipBlob: Blob,
  filename: string,
  thumbnailBlob: Blob,
  prompt?: string,
): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const videoType = clipBlob.type || "video/mp4";
      const thumbType = thumbnailBlob.type || "image/jpeg";

      const typedClipBlob = ensureBlobType(clipBlob, videoType);
      const typedThumbnailBlob = ensureBlobType(thumbnailBlob, thumbType);

      const clipData = {
        blob: typedClipBlob,
        blobType: videoType,
        filename: filename,
        thumbnail: typedThumbnailBlob,
        thumbnailType: thumbType,
        prompt: prompt || "",
        timestamp: Date.now(),
      };

      const request = store.put(clipData, "pendingClip");

      request.onsuccess = () => {
        localStorage.setItem("daydream_has_pending_clip", "true");
        localStorage.setItem("daydream_pending_clip_type", videoType);

        if (prompt) {
          localStorage.setItem("daydream_pending_clip_prompt", prompt);
        }

        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error storing clip in IndexedDB:", error);
    throw error;
  }
};

export const retrieveClip = async (): Promise<{
  blob: Blob;
  filename: string;
  thumbnail: Blob;
  prompt: string;
} | null> => {
  try {
    if (localStorage.getItem("daydream_has_pending_clip") !== "true") {
      return null;
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("pendingClip");

      request.onsuccess = () => {
        const clipData = request.result;
        if (!clipData) {
          resolve(null);
          return;
        }

        const videoType =
          clipData.blobType ||
          localStorage.getItem("daydream_pending_clip_type") ||
          "video/mp4";
        const thumbType = clipData.thumbnailType || "image/jpeg";

        const typedClipBlob = ensureBlobType(clipData.blob, videoType);
        const typedThumbnailBlob = ensureBlobType(
          clipData.thumbnail,
          thumbType,
        );

        resolve({
          blob: typedClipBlob,
          filename: clipData.filename,
          thumbnail: typedThumbnailBlob,
          prompt: clipData.prompt || "",
        });
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error retrieving clip from IndexedDB:", error);
    return null;
  }
};

export const deleteClip = async (): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete("pendingClip");

      request.onsuccess = () => {
        localStorage.removeItem("daydream_has_pending_clip");
        localStorage.removeItem("daydream_pending_clip_prompt");
        localStorage.removeItem("daydream_pending_clip_type");
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error deleting clip from IndexedDB:", error);
  }
};
