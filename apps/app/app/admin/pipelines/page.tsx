"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import { redirect, useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import EditPipelineModal from "./components/EditPipelineModal";
import { Pipeline } from "../types";

export default function PipelinesAdminPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { isAdmin, isLoading: adminLoading, email } = useAdmin();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Redirect non-admins away from this page
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      console.log("Access denied: Not an admin (livepeer.org email required)");
      redirect("/");
    }
  }, [isAdmin, adminLoading]);

  const fetchPipelines = async () => {
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

      const response = await fetch("/api/admin/pipelines", { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch pipelines");
      }
      const data = await response.json();
      setPipelines(data);
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
      fetchPipelines();
    }
  }, [isAdmin]);

  const handleEditClick = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedPipeline(null);
  };

  const handleSavePipeline = async (
    updatedPipeline: Partial<Pipeline> & { id: string },
  ) => {
    try {
      console.log("Received updatedPipeline:", updatedPipeline);

      const { id, ...fieldsToUpdate } = updatedPipeline;
      const sanitizedUpdate: Record<string, any> = { id };

      const allowedFields = [
        "name",
        "description",
        "is_private",
        "is_featured",
        "config",
        "prioritized_params",
        "cover_image",
        "version",
        "type",
      ];

      Object.keys(fieldsToUpdate).forEach(key => {
        if (allowedFields.includes(key)) {
          sanitizedUpdate[key] = fieldsToUpdate[key];
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

      const response = await fetch("/api/admin/pipelines/update", {
        method: "PUT",
        headers,
        body: JSON.stringify(sanitizedUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Pipeline update error:", errorData);
        throw new Error(errorData.error || "Failed to update pipeline");
      }

      await fetchPipelines();
    } catch (err) {
      console.error("Error in handleSavePipeline:", err);
      throw err;
    }
  };

  const handleDeleteClick = (pipelineId: string) => {
    setDeleteConfirmId(pipelineId);
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
        `/api/admin/pipelines/delete?id=${deleteConfirmId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete pipeline");
      }

      await fetchPipelines();
      setDeleteConfirmId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete pipeline",
      );
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleTestPipeline = (pipelineId: string) => {
    window.open(`/create?pipeline_id=${pipelineId}`, "_blank");
  };

  const handleDuplicatePipeline = async (pipeline: Pipeline) => {
    try {
      setIsLoading(true);

      const duplicatePipeline = {
        ...pipeline,
        id: undefined,
        name: `${pipeline.name} (copy)`,
        is_private: true, // Always make duplicates private
        is_featured: false, // Never make duplicates featured
      };

      delete duplicatePipeline.created_at;
      delete duplicatePipeline.updated_at;

      if (
        typeof duplicatePipeline.author === "object" &&
        duplicatePipeline.author !== null
      ) {
        const authorObj = duplicatePipeline.author as any;
        duplicatePipeline.author = authorObj.id || pipeline.author;
      }

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

      const response = await fetch("/api/admin/pipelines/create", {
        method: "POST",
        headers,
        body: JSON.stringify(duplicatePipeline),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to duplicate pipeline");
      }

      alert(`Pipeline "${pipeline.name}" successfully duplicated!`);

      await fetchPipelines();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate pipeline",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = (id: string) => {
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
        <h1 className="text-2xl font-bold mb-6">Pipelines</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pipelines</h1>

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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Private
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pipelines.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No pipelines found
                  </td>
                </tr>
              ) : (
                pipelines.map(pipeline => (
                  <tr
                    key={pipeline.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pipeline.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pipeline.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof pipeline.author === "object" &&
                      pipeline.author?.name
                        ? pipeline.author.name
                        : String(pipeline.author)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pipeline.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pipeline.is_private ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pipeline.is_featured ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      {deleteConfirmId === pipeline.id ? (
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
                              toggleMenu(pipeline.id);
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

                          {openMenuId === pipeline.id && (
                            <div
                              data-menu-id={pipeline.id}
                              className="absolute right-full mr-2 z-50 mt-0 w-40 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 flex flex-col"
                              style={{
                                maxHeight: "300px",
                                overflow: "visible",
                              }}
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleEditClick(pipeline);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleTestPipeline(pipeline.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                              >
                                Test
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDuplicatePipeline(pipeline);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteClick(pipeline.id);
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

      <EditPipelineModal
        pipeline={selectedPipeline}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePipeline}
      />
    </div>
  );
}
