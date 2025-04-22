"use client";

import { getAccessToken } from "@privy-io/react-auth";
import React, { useState, ChangeEvent, FormEvent } from "react";

interface UploadResponse {
  success: boolean;
  clip?: {
    id: number;
    videoUrl: string;
    thumbnailUrl?: string;
    title?: string;
    slug: string;
    status: string;
  };
  error?: string;
  details?: any;
}

function ClipUploader() {
  const [sourceClip, setSourceClip] = useState<File | null>(null);
  const [watermarkedClip, setWatermarkedClip] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [title, setTitle] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [sourceClipId, setSourceClipId] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<File | null>>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setter(event.target.files[0]);
      } else {
        setter(null);
      }
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sourceClip) {
      setError("Source Clip file is required.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("sourceClip", sourceClip);

    if (watermarkedClip) {
      formData.append("watermarkedClip", watermarkedClip);
    }
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    if (title) {
      formData.append("title", title);
    }

    formData.append("prompt", prompt);

    if (sourceClipId) {
      formData.append("sourceClipId", sourceClipId);
    }

    try {
      const response = await fetch("/api/clips", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });

      const result: UploadResponse = await response.json();

      if (!response.ok) {
        console.log(await response.text());
        throw new Error(
          result.error || `Upload failed with status: ${response.status}`,
        );
      }

      if (result.success && result.clip) {
        setSuccessMessage(
          `Clip uploaded successfully! Slug: ${result.clip.slug}, ID: ${result.clip.id}`,
        );
        setSourceClip(null);
        setWatermarkedClip(null);
        setThumbnail(null);
        setTitle("");
        setPrompt("");
        setSourceClipId("");
        const form = event.target as HTMLFormElement;
        form.reset();
      } else {
        throw new Error(result.error || "Upload failed for an unknown reason.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        maxWidth: "500px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Upload New Clip</h2>

      <div>
        <label htmlFor="sourceClip">Source Clip (Required):</label> <br />
        <input
          id="sourceClip"
          type="file"
          accept="video/*"
          onChange={handleFileChange(setSourceClip)}
          required
        />
      </div>

      <div>
        <label htmlFor="watermarkedClip">Watermarked Clip (Optional):</label>
        <br />
        <input
          id="watermarkedClip"
          type="file"
          accept="video/*"
          onChange={handleFileChange(setWatermarkedClip)}
        />
      </div>

      <div>
        <label htmlFor="thumbnail">Thumbnail (Optional):</label>
        <br />
        <input
          id="thumbnail"
          type="file"
          accept="image/*"
          onChange={handleFileChange(setThumbnail)}
        />
      </div>

      <div>
        <label htmlFor="title">Title (Optional):</label>
        <br />
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: "95%", padding: "8px" }}
        />
      </div>

      <div>
        <label htmlFor="prompt">Prompt (Optional):</label>
        <br />
        <textarea
          id="prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          style={{ width: "95%", padding: "8px" }}
        />
      </div>

      <div>
        <label htmlFor="sourceClipId">
          Source Clip ID (Optional - if remixing):
        </label>
        <br />
        <input
          id="sourceClipId"
          type="number"
          value={sourceClipId}
          onChange={e => setSourceClipId(e.target.value)}
          min="0"
          style={{ width: "95%", padding: "8px" }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{ padding: "10px 15px", cursor: isLoading ? "wait" : "pointer" }}
      >
        {isLoading ? "Uploading..." : "Upload Clip"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
    </form>
  );
}

export default ClipUploader;
