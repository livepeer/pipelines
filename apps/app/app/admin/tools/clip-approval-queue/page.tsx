"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useAdmin } from "@/hooks/useAdmin";
import { redirect } from "next/navigation";
import { Clip } from "@/app/admin/types";
import { useFfmpegClipPreview } from "@/hooks/useFfmpegClipPreview";
import { toast } from "sonner";

const uploadWithPresignedUrl = async (url: string, blob: Blob) => {
  const response = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type },
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
  return response;
};

export default function ClipApprovalQueue() {
  const { user } = usePrivy();
  const { isAdmin, isLoading: adminLoading, email } = useAdmin();

  const {
    isProcessing: isPreviewProcessing,
    ffmpegLoaded,
    error: ffmpegError,
    generatePreview,
  } = useFfmpegClipPreview();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    clipId: number | null;
    clipTitle: string;
    originalVideoUrl: string | null;
    action: "approve" | "reject" | null;
    previewStatus: "idle" | "generating" | "uploading" | "error" | "done";
    previewError: string | null;
  }>({
    isOpen: false,
    clipId: null,
    clipTitle: "",
    originalVideoUrl: null,
    action: null,
    previewStatus: "idle",
    previewError: null,
  });

  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const [pendingClips, setPendingClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<string[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      console.log("Access denied: Not an admin (livepeer.org email required)");
      redirect("/");
    }
  }, [isAdmin, adminLoading]);

  const fetchPendingClips = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      const headers = new Headers();
      if (user) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }

      const response = await fetch("/api/admin/clips", { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch clips");
      }

      const allClips = await response.json();

      // Filter only pending clips
      const pendingClipsOnly = allClips.filter(
        (clip: Clip) => clip.approval_status === "pending",
      );

      setPendingClips(pendingClipsOnly);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingClips();
    }
  }, [isAdmin]);

  const handleApproveClick = (
    clipId: number,
    clipTitle: string,
    originalVideoUrl: string,
  ) => {
    setConfirmDialog({
      isOpen: true,
      clipId,
      clipTitle,
      originalVideoUrl,
      action: "approve",
      previewStatus: "idle",
      previewError: null,
    });
  };

  const handleRejectClick = (clipId: number, clipTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      clipId,
      clipTitle,
      originalVideoUrl: null,
      action: "reject",
      previewStatus: "idle",
      previewError: null,
    });
  };

  const updateClipStatus = async (
    clipId: number,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      setActionLoading(clipId);
      const headers = new Headers({ "Content-Type": "application/json" });
      if (user && email) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }

      const response = await fetch("/api/admin/clips/update", {
        method: "PUT",
        headers,
        body: JSON.stringify({ id: clipId, approval_status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update status to ${newStatus}`,
        );
      }

      setPendingClips(clips => clips.filter(clip => clip.id !== clipId));
      toast.success(`Clip ${newStatus} successfully!`);
      return true;
    } catch (error) {
      console.error(`Error updating clip status to ${newStatus}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : `Failed to ${newStatus} clip`;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmApprove = async () => {
    if (!confirmDialog.clipId) return;
    const success = await updateClipStatus(confirmDialog.clipId, "approved");
    if (success) {
      handleCancelConfirmation();
    }
  };

  const handleGenerateAndApprove = async () => {
    if (
      !confirmDialog.clipId ||
      !confirmDialog.originalVideoUrl ||
      !ffmpegLoaded
    ) {
      console.error(
        "Missing data or FFmpeg not loaded for preview generation.",
      );
      return;
    }

    const clipId = confirmDialog.clipId;
    setActionLoading(clipId);
    setConfirmDialog(prev => ({
      ...prev,
      previewStatus: "generating",
      previewError: null,
    }));

    try {
      console.log("Fetching original video for preview...");
      const videoResponse = await fetch(confirmDialog.originalVideoUrl);
      if (!videoResponse.ok) throw new Error("Failed to fetch original video");
      const originalBlob = await videoResponse.blob();
      console.log("Original video fetched.");

      const previewBlob = await generatePreview(originalBlob);
      if (!previewBlob) {
        throw new Error(ffmpegError || "Preview generation failed.");
      }
      console.log("Preview generated.");

      setConfirmDialog(prev => ({ ...prev, previewStatus: "uploading" }));
      console.log("Getting presigned URL for preview...");
      const headers = new Headers({ "Content-Type": "application/json" });
      if (user && email) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }
      const presignedResponse = await fetch(
        "/api/admin/clips/presigned-preview-upload",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ originalClipId: clipId }),
        },
      );
      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(
          errorData.error || "Failed to get presigned URL for preview",
        );
      }
      const presignedData = await presignedResponse.json();
      console.log("Presigned URL obtained.");

      console.log("Uploading preview...");
      await uploadWithPresignedUrl(presignedData.uploadUrl, previewBlob);
      console.log("Preview uploaded successfully.");

      console.log("Making preview file public...");
      const makePublicResponse = await fetch(
        "/api/admin/clips/presigned-preview-upload",
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ filePath: presignedData.previewFilePath }),
        },
      );

      if (!makePublicResponse.ok) {
        console.warn(
          "Failed to make preview file public, it may not be accessible.",
        );
      } else {
        console.log("Preview file is now publicly accessible.");
      }

      setConfirmDialog(prev => ({ ...prev, previewStatus: "done" }));

      const updateSuccess = await updateClipStatus(clipId, "approved");

      if (updateSuccess) {
        handleCancelConfirmation();
      }
    } catch (error) {
      console.error("Error during generate & approve process:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Preview generation or upload failed.";
      setConfirmDialog(prev => ({
        ...prev,
        previewStatus: "error",
        previewError: errorMessage,
      }));
      toast.error(errorMessage);
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmDialog.clipId) return;
    const success = await updateClipStatus(confirmDialog.clipId, "rejected");
    if (success) {
      handleCancelConfirmation();
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      clipId: null,
      clipTitle: "",
      originalVideoUrl: null,
      action: null,
      previewStatus: "idle",
      previewError: null,
    });
  };

  if (adminLoading || isLoading) {
    return <div className="p-8">Loading pending clips...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clip Approval Queue</h1>
      <p className="mb-6 text-gray-600">
        Review and approve clips to be featured on the explore page.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!ffmpegLoaded && !ffmpegError && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Loading Clip Processor</p>
          <p>The client-side video processor is loading. Please wait...</p>
        </div>
      )}
      {ffmpegError && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
          role="alert"
        >
          <p className="font-bold">Clip Processor Error</p>
          <p>Could not load the client-side video processor: {ffmpegError}</p>
        </div>
      )}

      {pendingClips.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending clips to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pendingClips.map(clip => (
            <div
              key={clip.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className="relative w-full aspect-square"
                onMouseEnter={() => setHoveredClipId(clip.id.toString())}
                onMouseLeave={() => {
                  setHoveredClipId(null);
                  setLoadedVideos(prev =>
                    prev.filter(id => id !== clip.id.toString()),
                  );
                }}
              >
                <img
                  src={clip.thumbnail_url || "https://placehold.co/400x400"}
                  alt={clip.video_title || "Clip thumbnail"}
                  className="w-full h-full object-contain"
                  style={{
                    display:
                      hoveredClipId === clip.id.toString() &&
                      loadedVideos.includes(clip.id.toString())
                        ? "none"
                        : "block",
                  }}
                />
                {hoveredClipId === clip.id.toString() && (
                  <video
                    src={clip.video_url}
                    className="w-full h-full object-contain"
                    style={{
                      display: loadedVideos.includes(clip.id.toString())
                        ? "block"
                        : "none",
                    }}
                    autoPlay
                    muted
                    loop
                    onLoadedData={() => {
                      setLoadedVideos(prev => [...prev, clip.id.toString()]);
                    }}
                  />
                )}
                <div className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
                  {clip.approval_status}
                </div>
              </div>
              <div className="p-4">
                <h3
                  className="font-medium text-gray-900 mb-1 truncate"
                  title={clip.video_title || clip.prompt || "Untitled clip"}
                >
                  {clip.video_title ||
                    clip.prompt?.substring(0, 30) +
                      (clip.prompt && clip.prompt.length > 30 ? "..." : "") ||
                    "Untitled clip"}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Added: {new Date(clip.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mb-4 truncate">
                  By:{" "}
                  <span className="font-medium">
                    {typeof clip.author === "object" && clip.author?.name
                      ? clip.author.name
                      : typeof clip.author === "string"
                        ? clip.author
                        : "Unknown"}
                  </span>
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleApproveClick(
                        clip.id,
                        clip.video_title || "Untitled clip",
                        clip.video_url,
                      )
                    }
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading === clip.id}
                  >
                    {actionLoading === clip.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() =>
                      handleRejectClick(
                        clip.id,
                        clip.video_title || "Untitled clip",
                      )
                    }
                    className="flex-1 border border-gray-400 bg-white hover:bg-gray-100 text-gray-800 py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={actionLoading === clip.id}
                  >
                    {actionLoading === clip.id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4">
              Confirm{" "}
              {confirmDialog.action === "approve" ? "Approval" : "Rejection"}
            </h3>

            {confirmDialog.action === "approve" &&
              confirmDialog.originalVideoUrl && (
                <div className="mb-4">
                  <p className="text-sm mb-2">Original Clip:</p>
                  <video
                    src={confirmDialog.originalVideoUrl}
                    controls
                    className="w-full rounded max-h-[40vh]"
                  />
                </div>
              )}

            <p className="mb-6">
              {confirmDialog.action === "approve"
                ? ffmpegLoaded && !ffmpegError
                  ? `Generate a 4s preview and approve "${confirmDialog.clipTitle}"? It will appear on the explore page.`
                  : `FFmpeg preload failed. If approved, "${confirmDialog.clipTitle}" will be published without a preview clip. Do you want to continue?`
                : `Are you sure you want to reject "${confirmDialog.clipTitle}"?`}
            </p>

            {confirmDialog.action === "approve" &&
              (isPreviewProcessing ||
                confirmDialog.previewStatus === "uploading") && (
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
                    {confirmDialog.previewStatus === "generating"
                      ? "Generating preview..."
                      : "Uploading preview..."}
                  </p>
                </div>
              )}
            {confirmDialog.previewStatus === "error" && (
              <p className="text-sm text-red-600 mb-4">
                Error:{" "}
                {confirmDialog.previewError ||
                  "Preview generation/upload failed."}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={handleCancelConfirmation}
                disabled={actionLoading !== null}
              >
                Cancel
              </button>

              {confirmDialog.action === "approve" ? (
                ffmpegLoaded && !ffmpegError ? (
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGenerateAndApprove}
                    disabled={
                      actionLoading !== null ||
                      isPreviewProcessing ||
                      confirmDialog.previewStatus === "uploading"
                    }
                  >
                    {actionLoading !== null
                      ? "Processing..."
                      : "Generate Preview & Approve"}
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirmApprove}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading !== null
                      ? "Processing..."
                      : "Confirm Approve"}
                  </button>
                )
              ) : (
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                  onClick={handleConfirmReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading !== null ? "Processing..." : "Yes, Reject"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
