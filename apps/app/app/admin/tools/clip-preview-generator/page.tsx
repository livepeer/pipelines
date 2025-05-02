"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
// import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { useFfmpegClipPreview } from "@/hooks/useFfmpegClipPreview"; // Import the hook

export default function ClipPreviewGeneratorPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    isProcessing,
    ffmpegLoaded,
    error: ffmpegError,
    generatePreview,
  } = useFfmpegClipPreview();

  useEffect(() => {
    const currentVideoSrc = videoSrc;
    const currentDownloadUrl = downloadUrl;
    return () => {
      if (currentVideoSrc) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL (original):", currentVideoSrc);
      }
      if (currentDownloadUrl) {
        URL.revokeObjectURL(currentDownloadUrl);
        console.log("Revoked object URL (download):", currentDownloadUrl);
      }
    };
  }, [videoSrc, downloadUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "video/mp4") {
      setDownloadUrl(null); // Clear previous download
      setOriginalFile(file);
      setOriginalFileName(file.name);
      const url = URL.createObjectURL(file);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc(url);
    } else {
      alert("Please select an MP4 file.");
      setVideoSrc(null);
      setOriginalFileName(null);
      setOriginalFile(null);
      event.target.value = "";
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        setVideoSrc(null);
      }
    }
  };

  const handleGeneratePreviewClick = async () => {
    if (!originalFile || !ffmpegLoaded) {
      alert(
        "Please select a video file and wait for the processing library to load.",
      );
      return;
    }

    setDownloadUrl(null);

    const previewBlob = await generatePreview(originalFile);

    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      setDownloadUrl(url);
      console.log("Download URL created:", url);
    } else {
      console.error(
        "Preview generation failed (see hook error state or logs).",
      );
    }
  };

  const getDownloadFileName = () => {
    if (!originalFileName) return "preview-short.mp4";
    const nameWithoutExtension = originalFileName.replace(/\.mp4$/i, "");
    return `${nameWithoutExtension}-short.mp4`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clip Preview Generator</h1>
      <p className="mb-6 text-gray-600">
        Upload an MP4 file, preview it, and generate a 4-second, 360x360 preview
        clip using client-side processing.
      </p>

      {!ffmpegLoaded && !ffmpegError && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Loading Processor</p>
          <p>The video processing library is loading. Please wait...</p>
        </div>
      )}

      {ffmpegError && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Processing Error</p>
          <p>{ffmpegError}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label
          htmlFor="video-upload"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select MP4 File
        </label>
        <input
          type="file"
          id="video-upload"
          accept="video/mp4"
          onChange={handleFileChange}
          disabled={isProcessing || !ffmpegLoaded}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {videoSrc && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Preview Original</h2>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            className="w-full max-w-2xl rounded mb-4"
          />
          {/* Show processing indicator from hook */}
          {isProcessing && (
            <div className="flex items-center justify-center mb-4 space-x-2">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-sm text-indigo-700">
                Processing... This may take a moment.
              </p>
            </div>
          )}
          <button
            onClick={handleGeneratePreviewClick}
            disabled={
              isProcessing || !ffmpegLoaded || !originalFile || !!ffmpegError
            }
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Generate Preview (4s, 360x360)
          </button>
        </div>
      )}

      {downloadUrl && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Preview Ready</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your 4-second, 360x360 preview clip is ready for download.
          </p>
          <a
            href={downloadUrl}
            download={getDownloadFileName()}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
          >
            Download Preview Clip
          </a>
        </div>
      )}
    </div>
  );
}
