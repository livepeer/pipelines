"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pipeline } from "@/app/admin/types";
import { usePipelineForm } from "@/hooks/usePipelineForm";
import { ImageUploadInput } from "@/components/admin/ImageUploadInput";
import { JsonTextArea } from "@/components/admin/JsonTextArea";

interface EditPipelineModalProps {
  pipeline: Pipeline | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (pipeline: Partial<Pipeline> & { id: string }) => Promise<void>;
}

export default function EditPipelineModal({
  pipeline,
  isOpen,
  onClose,
  onSave,
}: EditPipelineModalProps) {
  const {
    formData,
    setFormData,
    configJson,
    setConfigJson,
    prioritizedParamsJson,
    setPrioritizedParamsJson,
    imageFile,
    setImageFile,
    imagePreview,
    setImagePreview,
    changedFields,
    setChangedFields,
    isUploading,
    jsonError,
    setJsonError,
    uploadError,
    setUploadError, // Get upload error state
    handleImageUpload, // Use hook's image upload
    validateJsonField, // Use hook's JSON validator
    resetForm, // Use hook's reset function
  } = usePipelineForm({ initialPipeline: pipeline });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadError) {
      setError(uploadError);
    } else {
      // TODO handle generic error
    }
  }, [uploadError]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, resetForm]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setFormData(prev => ({
        ...prev,
        [name]: newValue,
      }));

      if (pipeline && pipeline[name as keyof Pipeline] !== newValue) {
        setChangedFields(prev => {
          const updated = new Set(prev);
          updated.add(name);
          return updated;
        });
      } else {
        setChangedFields(prev => {
          const updated = new Set(prev);
          updated.delete(name);
          return updated;
        });
      }
    },
    [pipeline, setFormData, setChangedFields],
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(previewUrl);

      setChangedFields(prev => {
        const updated = new Set(prev);
        updated.add("cover_image");
        return updated;
      });
    },
    [setImageFile, setImagePreview, setChangedFields],
  );

  const handleConfigJsonChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setConfigJson(e.target.value);
    setJsonError(null);
    setChangedFields(prev => {
      const updated = new Set(prev);
      updated.add("config");
      return updated;
    });
  };

  const handlePrioritizedParamsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setPrioritizedParamsJson(e.target.value);
    setJsonError(null);
    setChangedFields(prev => {
      const updated = new Set(prev);
      updated.add("prioritized_params");
      return updated;
    });
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);

    setFormData(prev => ({
      ...prev,
      cover_image: undefined,
    }));

    setChangedFields(prev => {
      const updated = new Set(prev);
      updated.add("cover_image");
      return updated;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipeline) return;

    const configJsonObj = validateJsonField(configJson);
    const prioritizedParamsJsonObj = validateJsonField(prioritizedParamsJson);

    if (configJsonObj === null || prioritizedParamsJsonObj === null) {
      setError("Invalid JSON in config or prioritized parameters");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updates: Partial<Pipeline> & { id: string } = { id: pipeline.id };

      const allowedFields = [
        "name",
        "description",
        "is_private",
        "is_featured",
        "version",
        "type",
        "cover_image",
        "config",
        "prioritized_params",
      ];

      for (const field of Array.from(changedFields)) {
        if (
          allowedFields.includes(field) &&
          field !== "author" &&
          field !== "config" &&
          field !== "prioritized_params" &&
          field !== "cover_image"
        ) {
          updates[field as keyof Pipeline] = formData[field as keyof Pipeline];
        }
      }

      if (changedFields.has("config")) {
        updates.config = configJsonObj;
      }

      if (changedFields.has("prioritized_params")) {
        updates.prioritized_params = prioritizedParamsJsonObj;
      }

      if (changedFields.has("cover_image")) {
        if (imageFile) {
          const coverImageUrl = await handleImageUpload();
          if (coverImageUrl) {
            updates.cover_image = coverImageUrl;
          } else {
            throw new Error("Failed to upload image");
          }
        } else if (imagePreview === null) {
          updates.cover_image = undefined;
        }
      }

      console.log("Changed fields:", Array.from(changedFields));
      console.log("Sending update payload:", updates);

      await onSave(updates);
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !pipeline) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Pipeline</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Display JSON validation error from hook */}
        {jsonError && !error && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded">
            {jsonError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <input
                type="text"
                name="type"
                value={formData.type || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formData.version || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4 col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mb-4 col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>

              <ImageUploadInput
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
                onSelectImage={handleSelectImage}
                fileInputRef={fileInputRef}
              />
            </div>

            <div className="mb-4">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_private"
                    name="is_private"
                    checked={formData.is_private || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_private"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Private
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_featured"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Featured
                  </label>
                </div>
              </div>
            </div>
          </div>

          <JsonTextArea
            label="Config (JSON)"
            value={configJson}
            onChange={handleConfigJsonChange}
            rows={8}
            placeholder="{}"
            helpText="Enter valid JSON for the pipeline configuration"
            hasError={!!jsonError && changedFields.has("config")} // Indicate error only if this field caused it
          />

          <JsonTextArea
            label="Prioritized Parameters (JSON)"
            value={prioritizedParamsJson}
            onChange={handlePrioritizedParamsChange}
            rows={4}
            placeholder="[]"
            helpText="Enter valid JSON array of prioritized parameters"
            hasError={!!jsonError && changedFields.has("prioritized_params")} // Indicate error only if this field caused it
          />

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading || changedFields.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving || isUploading
                ? `${isUploading ? "Uploading..." : "Saving..."}`
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
