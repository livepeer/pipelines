"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { redirect, useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import EditClipModal from "./components/EditClipModal";
import { Clip } from "../types";

export default function ClipsAdminPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { isAdmin, isLoading: adminLoading, email } = useAdmin();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Redirect non-admins away from this page
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      console.log("Access denied: Not an admin (livepeer.org email required)");
      redirect("/");
    }
  }, [isAdmin, adminLoading]);

  const fetchClips = async () => {
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
      const data = await response.json();
      setClips(data);
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
      fetchClips();
    }
  }, [isAdmin]);

  const handleEditClick = (clip: Clip) => {
    setSelectedClip(clip);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedClip(null);
  };

  const handleSaveClip = async (
    updatedClip: Partial<Clip> & { id: number },
  ) => {
    try {
      console.log("Received updatedClip:", updatedClip);

      const { id, ...fieldsToUpdate } = updatedClip;
      const sanitizedUpdate: Record<string, any> = { id };

      const allowedFields = [
        "video_url",
        "video_title",
        "thumbnail_url",
        "author_user_id",
        "source_clip_id",
        "prompt",
        "priority",
      ];

      Object.keys(fieldsToUpdate).forEach(key => {
        if (allowedFields.includes(key)) {
          sanitizedUpdate[key] = (fieldsToUpdate as Record<string, any>)[key];
        }
      });

      console.log("Sanitized update payload:", sanitizedUpdate);

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

      const response = await fetch("/api/admin/clips/update", {
        method: "PUT",
        headers,
        body: JSON.stringify(sanitizedUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Clip update error:", errorData);
        throw new Error(errorData.error || "Failed to update clip");
      }

      await fetchClips();
    } catch (err) {
      console.error("Error in handleSaveClip:", err);
      throw err;
    }
  };

  const handleDeleteClick = (clipId: number) => {
    setDeleteConfirmId(clipId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const headers = new Headers();

      if (user && email) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }

      const response = await fetch(
        `/api/admin/clips/delete?id=${deleteConfirmId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete clip");
      }

      await fetchClips();
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete clip");
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleCreateClip = () => {
    const newClip: Clip = {
      id: 0,
      video_url: "",
      author_user_id: user?.id || "",
      prompt: "",
      created_at: new Date().toISOString(),
    };

    setSelectedClip(newClip);
    setIsEditModalOpen(true);
  };

  const toggleMenu = (id: number) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Element) {
        const menuElement = document.querySelector(
          '[data-menu-id="' + openMenuId + '"]',
        );
        if (menuElement && menuElement.contains(event.target)) {
          return;
        }
      }
      setOpenMenuId(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  if (adminLoading || isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Clips</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clips</h1>
        <button
          onClick={handleCreateClip}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create New Clip
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clips.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No clips found
                  </td>
                </tr>
              ) : (
                clips.map(clip => (
                  <tr
                    key={clip.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clip.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clip.thumbnail_url ? (
                        <img
                          src={clip.thumbnail_url}
                          alt="Thumbnail"
                          className="w-16 h-9 object-cover rounded"
                        />
                      ) : (
                        "No thumbnail"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate">
                      {clip.prompt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof clip.author === "object" && clip.author?.name
                        ? clip.author.name
                        : clip.author_user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(clip.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {clip.priority || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      {deleteConfirmId === clip.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleConfirmDelete}
                            className="text-red-600 hover:text-red-900"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleMenu(clip.id);
                            }}
                            className="text-gray-700 hover:text-black"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {openMenuId === clip.id && (
                            <div
                              data-menu-id={clip.id}
                              className="absolute right-full mr-2 z-50 mt-0 w-40 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 flex flex-col"
                              style={{
                                maxHeight: "300px",
                                overflow: "visible",
                              }}
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleEditClick(clip);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <a
                                href={clip.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                                onClick={() => setOpenMenuId(null)}
                              >
                                View
                              </a>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteClick(clip.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditClipModal
        clip={selectedClip}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveClip}
      />
    </div>
  );
}
