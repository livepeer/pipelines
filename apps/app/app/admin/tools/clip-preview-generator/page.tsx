'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';

export default function ClipPreviewGeneratorPage() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      setDownloadUrl(null);
      setOriginalFileName(file.name);
      const url = URL.createObjectURL(file);
      // Revoke previous URL if it exists
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      setVideoSrc(url);
    } else {
      alert('Please select an MP4 file.');
      setVideoSrc(null);
      setOriginalFileName(null);
      event.target.value = ''; // Reset file input
      // Revoke URL if a non-MP4 file was previously selected
      if (videoSrc) {
         URL.revokeObjectURL(videoSrc);
         setVideoSrc(null);
      }
    }
  };

  // Add useEffect for cleanup on unmount
  useEffect(() => {
    // Store the current videoSrc in a variable
    const currentVideoSrc = videoSrc;
    return () => {
      if (currentVideoSrc) {
        URL.revokeObjectURL(currentVideoSrc);
        console.log('Revoked object URL:', currentVideoSrc);
      }
    };
  }, [videoSrc]); // Rerun cleanup logic if videoSrc changes

  const handleGeneratePreview = async () => {
    if (!videoRef.current || !videoSrc) return;

    setIsProcessing(true);
    setIsRecording(true);
    setDownloadUrl(null);
    recordedChunksRef.current = [];

    try {
      const stream = (videoRef.current as any).captureStream();

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const originalWidth = settings.width;
        const originalHeight = settings.height;

        if (originalWidth && originalHeight) {
          const targetWidth = Math.round(originalWidth * 0.33);
          const targetHeight = Math.round(originalHeight * 0.33);
          console.log(`Attempting to constrain video track to ${targetWidth}x${targetHeight}`);
          try {
             await videoTrack.applyConstraints({ width: targetWidth, height: targetHeight });
             console.log('Successfully applied constraints.');
          } catch (constraintError) {
            console.warn('Could not apply resolution constraints:', constraintError);
          }
        } else {
           console.warn('Could not get original video dimensions to apply constraints.');
        }
      } else {
         console.warn('Could not get video track from stream.');
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/mp4' });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsRecording(false);
        setIsProcessing(false);
        videoRef.current?.pause();
        videoRef.current?.load(); // Reset video to show poster or first frame
      };

      videoRef.current.currentTime = 0; // Ensure playback starts from the beginning
      await videoRef.current.play();
      mediaRecorderRef.current.start();

      // Stop recording after 4 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 4000);

    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. Check console for details.');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const getDownloadFileName = () => {
    if (!originalFileName) return 'preview-short.mp4';
    const nameWithoutExtension = originalFileName.replace(/\.mp4$/i, '');
    return `${nameWithoutExtension}-short.mp4`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Clip Preview Generator</h1>
      <p className="mb-6 text-gray-600">Upload an MP4 file, preview it, and generate a 5-second preview clip.</p>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label htmlFor="video-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Select MP4 File
        </label>
        <input
          type="file"
          id="video-upload"
          accept="video/mp4"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {videoSrc && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            className="w-full max-w-2xl rounded"
          />
          <button
            onClick={handleGeneratePreview}
            disabled={isProcessing || isRecording}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isRecording ? 'Recording...' : 'Processing...'}
              </>
            ) : (
              'Generate Preview (5 seconds)'
            )}
          </button>
        </div>
      )}

      {downloadUrl && (
         <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Preview Ready</h2>
          <p className="text-sm text-gray-600 mb-4">Your 5-second preview clip is ready for download.</p>
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