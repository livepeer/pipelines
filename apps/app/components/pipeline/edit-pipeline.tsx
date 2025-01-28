"use client";

import { createPipelineFromFormData } from "@/app/api/pipelines/create";
import LoggedOutComponent from "@/components/modals/logged-out";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { decamelize } from "humps";
import { Loader2, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FileUploadDropzone, { FileType } from "./json-upload";
import { editPipelineFromFormData } from "@/app/api/pipelines/edit";
import { pipelineSchema, PipelineSchema } from "@/lib/types";

export default function EditPipeline({
  pipeline,
}: {
  pipeline: PipelineSchema & { id: string };
}) {
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    return {
      id: pipeline.id,
      name: pipeline.name,
      version: pipeline.version,
      description: pipeline.description,
      coverImage: pipeline.cover_image,
      comfyJson: JSON.stringify(pipeline.config, null, 2),
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string
  ) => {
    setFormData((prev) => ({ ...prev, [id]: e.target.value }));
    console.log(formData);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Saving pipeline...");
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(decamelize(key), value as any);
      });
      console.log("Form data to send::", formDataToSend, formData);
      const pipeline = await editPipelineFromFormData(formDataToSend, user.id);
      toast.dismiss(toastId);
      toast.success("Pipeline saved successfully");
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create pipeline: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Fetch cover_image blob from API
    try {
      const fetchCoverImage = async () => {
        const response = await fetch(formData.coverImage as string);
        const blob = await response.blob();
        const file = new File([blob], "cover_image");
        setFormData((prev) => ({ ...prev, coverImage: file }));
        setIsLoading(false);
      };
      setIsLoading(true);
      fetchCoverImage();
    } catch (error) {
      console.error("Error fetching cover image:", error);
      setIsLoading(false);
    }
  }, []);

  if (!isAuthLoaded) {
    return <LoaderCircleIcon className="w-8 h-8 animate-spin" />;
  }

  if (!authenticated) {
    return <LoggedOutComponent text="Sign in to create pipelines" />;
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg">Edit pipeline</h3>
      <ScrollArea className="h-[90vh] max-w-xl w-full">
        <div className="space-y-4 mt-4 p-0.5">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">ID</Label>
            <p className="text-sm">{formData.id as string}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Name</Label>
            <Input
              value={formData.name as string}
              placeholder="e.g., Live Portrait Generator"
              id="name"
              onChange={(e) => handleChange(e, "name")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Version</Label>
            <Input
              value={formData.version as string}
              placeholder="e.g., 1.0.0 in format major.minor.patch"
              id="version"
              onChange={(e) => handleChange(e, "version")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={formData.description as string}
              placeholder="Describe what your pipeline does and its use cases"
              id="description"
              className="h-24 resize-y"
              onChange={(e) => handleChange(e, "description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Cover image</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <FileUploadDropzone
                placeholder="Upload cover image"
                id="coverImage"
                setFormData={setFormData}
                fileType={FileType.Image}
                initialFiles={
                  formData.coverImage ? [formData.coverImage as File] : []
                }
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">ComfyUI JSON</Label>
            <Textarea
              value={formData.comfyJson as string}
              placeholder="ComfyUI JSON"
              id="comfyJson"
              className="h-48 resize-y"
              onChange={(e) => handleChange(e, "comfyJson")}
              rows={10}
            />
          </div>

          <div className="flex">
            <Button
              className="mt-4 uppercase text-xs"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Save
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
