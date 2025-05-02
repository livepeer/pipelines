"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export default function ClipPreviewGeneratorPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<any>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        console.log("Initializing FFmpeg (v0.10)... ");
        ffmpegRef.current = createFFmpeg({
          log: true,
          corePath: "/ffmpeg/ffmpeg-core.js",
        });
      }

      try {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg && !ffmpeg.isLoaded()) {
          console.log("Loading FFmpeg core...");
          await ffmpeg.load();
          console.log("FFmpeg core loaded successfully.");
        }
        setFfmpegLoaded(true);
      } catch (error) {
        console.error("Error loading FFmpeg core:", error);
        setFfmpegLoaded(false);
        alert(
          "Failed to load video processing library. Please refresh the page.",
        );
      }
    };
    loadFFmpeg();

    return () => {};
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "video/mp4") {
      setDownloadUrl(null);
      setOriginalFile(file);
      setOriginalFileName(file.name);
      const url = URL.createObjectURL(file);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc(url);
      setFfmpegProgress(0);
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

  useEffect(() => {
    const currentVideoSrc = videoSrc;
    return () => {
      if (currentVideoSrc) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log("Revoked object URL:", currentVideoSrc);
      }
    };
  }, [videoSrc]);

  const handleGeneratePreview = async () => {
    const ffmpeg = ffmpegRef.current;

    if (!originalFile || !ffmpegLoaded || !ffmpeg) {
      alert(
        "Please select a video file and wait for the processing library to load.",
      );
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);
    setFfmpegProgress(0);

    const inputFilename = "input.mp4";
    const outputFilename = "output.mp4";

    try {
      console.log("Starting FFmpeg processing (v0.10)...");

      console.log("Writing file to FFmpeg FS...");
      ffmpeg.FS("writeFile", inputFilename, await fetchFile(originalFile));
      console.log("File written.");

      console.log("Executing FFmpeg command...");
      await ffmpeg.run(
        "-i",
        inputFilename,
        "-t",
        "4",
        "-vf",
        "scale=360:360:force_original_aspect_ratio=decrease,pad=360:360:(ow-iw)/2:(oh-ih)/2:color=black",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-an",
        outputFilename,
      );
      console.log("FFmpeg command executed.");
      setFfmpegProgress(1);

      console.log("Reading processed file from FFmpeg FS...");
      const data = ffmpeg.FS("readFile", outputFilename);
      console.log("Processed file read.");

      if (data instanceof Uint8Array) {
        const blob = new Blob([data.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        console.log("Download URL created:", url);
      } else {
        throw new Error("FFmpeg output data is not a Uint8Array");
      }
    } catch (error) {
      console.error("Error during FFmpeg processing:", error);
      alert(
        "Failed to generate preview. Check console for details. Error: " +
          (error instanceof Error ? error.message : String(error)),
      );
      setFfmpegProgress(0);
    } finally {
      setIsProcessing(false);
      console.log("Processing finished.");
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

      {!ffmpegLoaded && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Loading Processor</p>
          <p>The video processing library is loading. Please wait...</p>
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
          {isProcessing && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${ffmpegProgress * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-indigo-700 mb-4">
                Processing... This may take a moment.
              </p>
            </>
          )}
          <button
            onClick={handleGeneratePreview}
            disabled={isProcessing || !ffmpegLoaded || !originalFile}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Processing...
              </>
            ) : (
              "Generate Preview (4s, 360x360)"
            )}
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
