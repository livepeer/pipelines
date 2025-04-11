import { useState, useEffect, useCallback } from 'react';
import { Pipeline } from '@/app/admin/types';

// Define the shape of the state and return values for the hook
interface UsePipelineFormProps {
  initialPipeline: Pipeline | null;
}

interface UsePipelineFormReturn {
  formData: Partial<Pipeline>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Pipeline>>>;
  configJson: string;
  setConfigJson: React.Dispatch<React.SetStateAction<string>>;
  prioritizedParamsJson: string;
  setPrioritizedParamsJson: React.Dispatch<React.SetStateAction<string>>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  imagePreview: string | null;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  changedFields: Set<string>;
  setChangedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  isUploading: boolean;
  jsonError: string | null;
  setJsonError: React.Dispatch<React.SetStateAction<string | null>>;
  uploadError: string | null;
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>;
  handleImageUpload: () => Promise<string | undefined>;
  validateJsonField: (jsonString: string) => any | null;
  resetForm: () => void;
}

export function usePipelineForm({ initialPipeline }: UsePipelineFormProps): UsePipelineFormReturn {
  const [formData, setFormData] = useState<Partial<Pipeline>>({});
  const [configJson, setConfigJson] = useState<string>("");
  const [prioritizedParamsJson, setPrioritizedParamsJson] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null); // Separate error for uploads

  const resetForm = useCallback(() => {
    if (initialPipeline) {
      setFormData({
        id: initialPipeline.id,
        name: initialPipeline.name,
        description: initialPipeline.description,
        is_private: initialPipeline.is_private,
        is_featured: initialPipeline.is_featured || false,
        version: initialPipeline.version || "",
        type: initialPipeline.type || "",
        cover_image: initialPipeline.cover_image,
      });
      setImagePreview(initialPipeline.cover_image || null);
      setImageFile(null);
      try {
        setConfigJson(
          initialPipeline.config ? JSON.stringify(initialPipeline.config, null, 2) : "{}"
        );
        setPrioritizedParamsJson(
          initialPipeline.prioritized_params
            ? JSON.stringify(initialPipeline.prioritized_params, null, 2)
            : "[]"
        );
        setJsonError(null);
      } catch (err) {
        setJsonError("Invalid JSON in initial pipeline data");
        setConfigJson("{}");
        setPrioritizedParamsJson("[]");
      }
      setChangedFields(new Set());
      setUploadError(null);
    } else {
      // Reset to empty state if no initial pipeline
      setFormData({});
      setConfigJson("{}");
      setPrioritizedParamsJson("[]");
      setImageFile(null);
      setImagePreview(null);
      setChangedFields(new Set());
      setJsonError(null);
      setUploadError(null);
    }
  }, [initialPipeline]);

  useEffect(() => {
    resetForm();
  }, [initialPipeline, resetForm]);

  const handleImageUpload = useCallback(async (): Promise<string | undefined> => {
    if (!imageFile) return formData.cover_image;

    setIsUploading(true);
    setUploadError(null); // Clear previous upload errors
    try {
      const response = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: imageFile.name, contentType: imageFile.type }),
      });

      if (!response.ok) throw new Error(`Failed to get upload URL (${response.status})`);

      const { uploadUrl, fileUrl } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!uploadResponse.ok) throw new Error(`Failed to upload image (${uploadResponse.status})`);

      return fileUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image. Please try again.");
      return undefined;
    } finally {
      setIsUploading(false);
    }
  }, [imageFile, formData.cover_image]);

  const validateJsonField = useCallback((jsonString: string): any | null => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      setJsonError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, []);

  return {
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
    setJsonError, // Allow component to clear JSON error if needed
    uploadError,
    setUploadError, // Allow component to manage upload error display/clearing
    handleImageUpload,
    validateJsonField,
    resetForm,
  };
} 