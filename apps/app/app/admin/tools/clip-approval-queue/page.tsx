"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { useAdmin } from "@/hooks/useAdmin";
import { redirect } from "next/navigation";
import { Clip } from "@/app/admin/types";

export default function ClipApprovalQueue() {
  const { user } = usePrivy();
  const { isAdmin, isLoading: adminLoading, email } = useAdmin();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    clipId: number | null;
    clipTitle: string;
    action: "approve" | "reject" | null;
  }>({
    isOpen: false,
    clipId: null,
    clipTitle: "",
    action: null,
  });

  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const [pendingClips, setPendingClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<string[]>([]);

  // Redirect non-admins away from this page
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

  const handleApproveClick = (clipId: number, clipTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      clipId,
      clipTitle,
      action: "approve",
    });
  };

  const handleRejectClick = (clipId: number, clipTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      clipId,
      clipTitle,
      action: "reject",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.clipId || !confirmDialog.action) return;

    try {
      setActionLoading(confirmDialog.clipId);

      const headers = new Headers({
        "Content-Type": "application/json",
      });

      if (user && email) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }

      const newStatus =
        confirmDialog.action === "approve" ? "approved" : "rejected";

      const response = await fetch("/api/admin/clips/update", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id: confirmDialog.clipId,
          approval_status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Clip ${confirmDialog.action} error:`, errorData);
        throw new Error(
          errorData.error || `Failed to ${confirmDialog.action} clip`,
        );
      }

      // Update local state to remove the actioned clip
      setPendingClips(clips =>
        clips.filter(clip => clip.id !== confirmDialog.clipId),
      );
    } catch (error) {
      console.error(`Error ${confirmDialog.action}ing clip:`, error);
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${confirmDialog.action} clip`,
      );
    } finally {
      setActionLoading(null);
      setConfirmDialog({
        isOpen: false,
        clipId: null,
        clipTitle: "",
        action: null,
      });
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      clipId: null,
      clipTitle: "",
      action: null,
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
                <h3 className="font-medium text-gray-900 mb-1">
                  {clip.video_title ||
                    clip.prompt?.substring(0, 30) + "..." ||
                    "Untitled clip"}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Added: {new Date(clip.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Uploaded by:{" "}
                  <span className="font-bold">
                    {typeof clip.author === "object" && clip.author?.name
                      ? clip.author.name
                      : typeof clip.author === "string"
                        ? clip.author
                        : "Unknown user"}
                  </span>
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleApproveClick(
                        clip.id,
                        clip.video_title || "Untitled clip",
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              Confirm{" "}
              {confirmDialog.action === "approve" ? "Approval" : "Rejection"}
            </h3>
            <p className="mb-6">
              {confirmDialog.action === "approve"
                ? `Are you sure you want to approve "${confirmDialog.clipTitle}"? It will appear on the explore page.`
                : `Are you sure you want to reject "${confirmDialog.clipTitle}"?`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={handleCancelConfirmation}
                disabled={actionLoading !== null}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors disabled:opacity-50"
                onClick={handleConfirmAction}
                disabled={actionLoading !== null}
              >
                {actionLoading !== null
                  ? "Processing..."
                  : `Yes, ${confirmDialog.action === "approve" ? "Approve" : "Reject"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
