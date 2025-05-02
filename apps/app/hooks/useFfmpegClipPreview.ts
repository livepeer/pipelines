import { useState, useRef, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

// Define the structure for the hook's return values
interface UseFfmpegClipPreviewReturn {
  isProcessing: boolean;
  ffmpegLoaded: boolean;
  error: string | null;
  generatePreview: (inputFile: File | Blob) => Promise<Blob | null>;
}

export function useFfmpegClipPreview(): UseFfmpegClipPreviewReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<any>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        console.log("Initializing FFmpeg (v0.10) for hook... ");
        ffmpegRef.current = createFFmpeg({
          log: true,
          corePath: "/ffmpeg/ffmpeg-core.js",
        });
      }

      try {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg && !ffmpeg.isLoaded()) {
          console.log("Loading FFmpeg core for hook...");
          await ffmpeg.load();
          console.log("FFmpeg core loaded successfully for hook.");
        }
        setFfmpegLoaded(true);
        setError(null);
      } catch (err) {
        console.error("Error loading FFmpeg core in hook:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load video processing library.",
        );
        setFfmpegLoaded(false);
      }
    };

    loadFFmpeg();

    return () => {};
  }, []);

  const generatePreview = async (
    inputFile: File | Blob,
  ): Promise<Blob | null> => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpegLoaded || !ffmpeg || !inputFile) {
      setError("FFmpeg not ready or no input file provided.");
      console.error(
        "Attempted to generate preview when FFmpeg not ready or input missing.",
      );
      return null;
    }

    setIsProcessing(true);
    setError(null);
    const inputFilename = "input.mp4";
    const outputFilename = "output-short.mp4";

    try {
      console.log("Starting preview generation...");

      console.log("Writing input file to FFmpeg FS...");
      ffmpeg.FS("writeFile", inputFilename, await fetchFile(inputFile));
      console.log("Input file written.");

      console.log("Executing FFmpeg command...");
      await ffmpeg.run(
        "-y",
        "-ss",
        "0",
        "-t",
        "4",
        "-i",
        inputFilename,
        "-vf",
        "scale=480:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryslow",
        "-crf",
        "26",
        "-an",
        "-movflags",
        "+faststart",
        outputFilename,
      );
      console.log("FFmpeg command executed.");

      console.log("Reading processed file from FFmpeg FS...");
      const data = ffmpeg.FS("readFile", outputFilename);
      console.log("Processed file read.");

      try {
        ffmpeg.FS("unlink", inputFilename);
        ffmpeg.FS("unlink", outputFilename);
      } catch (cleanupError) {
        console.warn("Could not unlink temporary FFmpeg files:", cleanupError);
      }

      if (data instanceof Uint8Array) {
        const outputBlob = new Blob([data.buffer], { type: "video/mp4" });
        console.log("Preview generation successful.");
        return outputBlob;
      } else {
        throw new Error("FFmpeg output data is not a Uint8Array");
      }
    } catch (err) {
      console.error("Error during FFmpeg processing in hook:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate preview.",
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, ffmpegLoaded, error, generatePreview };
}
