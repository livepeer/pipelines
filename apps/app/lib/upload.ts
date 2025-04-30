export interface UploadResult {
  uploadUrl: string;
  publicUrl: string;
}

export async function getUploadUrl(filename: string, contentType: string): Promise<UploadResult> {
  const response = await fetch('/api/clips/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  return response.json();
}

export async function uploadFile(file: File, uploadUrl: string, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export interface UploadFiles {
  sourceClip: File;
  watermarkedClip: File;
  thumbnail: File;
}

export interface UploadMetadata {
  title: string | null;
  prompt: string;
  sourceClipId?: number;
  isFeatured?: boolean;
}

export async function uploadClip(
  files: UploadFiles,
  metadata: UploadMetadata,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; clip?: any; error?: string }> {
  try {
    // Get presigned URLs for each file
    const [sourceClipUrl, watermarkedClipUrl, thumbnailUrl] = await Promise.all([
      getUploadUrl(files.sourceClip.name, files.sourceClip.type),
      getUploadUrl(files.watermarkedClip.name, files.watermarkedClip.type),
      getUploadUrl(files.thumbnail.name, files.thumbnail.type),
    ]);

    // Upload files directly to GCS
    const uploadPromises = [
      uploadFile(files.sourceClip, sourceClipUrl.uploadUrl, (progress) => {
        if (onProgress) onProgress(progress * 0.3); // 30% of total progress
      }),
      uploadFile(files.watermarkedClip, watermarkedClipUrl.uploadUrl, (progress) => {
        if (onProgress) onProgress(0.3 + progress * 0.3); // 30-60% of total progress
      }),
      uploadFile(files.thumbnail, thumbnailUrl.uploadUrl, (progress) => {
        if (onProgress) onProgress(0.6 + progress * 0.4); // 60-100% of total progress
      }),
    ];

    await Promise.all(uploadPromises);

    // Submit clip metadata with public URLs
    const formData = new FormData();
    formData.append('title', metadata.title || '');
    formData.append('prompt', metadata.prompt);
    if (metadata.sourceClipId) {
      formData.append('sourceClipId', metadata.sourceClipId.toString());
    }
    if (metadata.isFeatured) {
      formData.append('isFeatured', 'true');
    }
    formData.append('sourceClipUrl', sourceClipUrl.publicUrl);
    formData.append('watermarkedClipUrl', watermarkedClipUrl.publicUrl);
    formData.append('thumbnailUrl', thumbnailUrl.publicUrl);

    const response = await fetch('/api/clips', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create clip');
    }

    const result = await response.json();
    return { success: true, clip: result.clip };
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
} 