"use client";

import { editPipelineFromFormData } from "@/app/api/pipelines/edit";
import LoggedOutComponent from "@/components/modals/logged-out";
import { PipelineSchema } from "@/lib/types";
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
import { useRouter } from "next/navigation";
import PipelineParamsSelector from "./pipeline-params-selector";

export default function EditPipeline({
  pipeline,
}: {
  pipeline: PipelineSchema & { id: string };
}) {
  const router = useRouter();
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  
  // currentStep === 1: edit basic pipeline info
  // currentStep === 2: edit prioritized params via the selector
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const defaultValue = (pipeline.config as any)?.inputs?.primary?.defaultValue || pipeline.config;
    
    const initialFormData = {
      id: pipeline.id,
      name: pipeline.name,
      version: pipeline.version,
      description: pipeline.description,
      coverImage: pipeline.cover_image,
      comfyJson: JSON.stringify(defaultValue, null, 2),
      prioritized_params: pipeline.prioritized_params || null,
    };
    return initialFormData;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string
  ) => {
    setFormData((prev) => ({ ...prev, [id]: e.target.value }));
  };

  const handleSubmit = async (updatedData?: Record<string, unknown>) => {
    const finalData = updatedData ? updatedData : formData;
    if (!user?.id) {
      toast.error("User not found");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Saving pipeline...");
    try {
      const formDataToSend = new FormData();
      Object.entries(finalData).forEach(([key, value]) => {
        if (key === 'prioritized_params' && typeof value === 'string') {
          formDataToSend.append(decamelize(key), value);
        } else {
          formDataToSend.append(decamelize(key), value as any);
        }
      });
      const { pipeline: updatedPipeline, smokeTestStream } =
        await editPipelineFromFormData(formDataToSend, user.id);
      toast.dismiss(toastId);
      toast.success("Pipeline saved successfully");
      router.push(
        `/pipelines/${updatedPipeline.id}?streamId=${smokeTestStream.id}&validation=true`
      );
    } catch (error) {
      toast.dismiss(toastId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to update pipeline: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!formData.name || !formData.description || !formData.comfyJson) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  useEffect(() => {
    const fetchCoverImage = async () => {
      if (typeof formData.coverImage === "string") {
        try {
          const response = await fetch(formData.coverImage as string);
          const blob = await response.blob();
          const file = new File([blob], "cover_image");
          setFormData((prev) => ({ ...prev, coverImage: file }));
        } catch (error) {
          console.error("Error fetching cover image:", error);
        }
      }
      setIsLoading(false);
    };
    fetchCoverImage();
  }, []);

  if (!isAuthLoaded) {
    return <LoaderCircleIcon className="w-8 h-8 animate-spin" />;
  }

  if (!authenticated) {
    return <LoggedOutComponent text="Sign in to edit pipelines" />;
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg">Edit Pipeline</h3>
      <ScrollArea className="h-[90vh] max-w-xl w-full">
        {currentStep === 1 ? (
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
                placeholder="Describe your pipeline"
                id="description"
                className="h-24 resize-y"
                onChange={(e) => handleChange(e, "description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Cover Image</Label>
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

            <div className="flex justify-end">
              <Button
                className="mt-4 uppercase text-xs"
                onClick={handleNext}
              >
                Next: Edit Prioritized Params
              </Button>
            </div>
          </div>
        ) : (
          <PipelineParamsSelector
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </ScrollArea>
    </div>
  );
}
