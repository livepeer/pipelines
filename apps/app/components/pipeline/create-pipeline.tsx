"use client";

import LoggedOutComponent from "@/components/modals/logged-out";
import { usePrivy } from "@privy-io/react-auth";
import { Input } from "@repo/design-system/components/ui/input";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import FileUploadDropzone, { FileType } from "./json-upload";
import { Label } from "@repo/design-system/components/ui/label";
import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { decamelize } from "humps";
import { createPipelineFromFormData } from "@/app/api/pipelines/create";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";
import PipelineParamsSelector from "./pipeline-params-selector";

export default function CreatePipeline() {
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string
  ) => {
    setFormData((prev) => ({ ...prev, [id]: e.target.value }));
  };

  const handleNext = async () => {
    if (!formData.name) {
      toast.error("Please enter a name");
      return;
    }
    if (!formData.description) {
      toast.error("Please enter a description");
      return;
    }
    if (!formData.comfyJson) {
      toast.error("Please upload a ComfyUI JSON file");
      return;
    }

    try {
      const jsonFile = formData.comfyJson as File;
      const jsonContent = await jsonFile.text();
      const parsedJson = JSON.parse(jsonContent);

      setFormData((prev) => ({
        ...prev,
        comfyJson: parsedJson,
      }));

      setCurrentStep(2);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      toast.error("Invalid JSON file");
      return;
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (updatedFormData: Record<string, unknown>) => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Creating pipeline...");
    try {
      const formDataToSend = new FormData();
      Object.entries(updatedFormData).forEach(([key, value]) => {
        if (key === "comfyJson") {
          // Create a new File object from the JSON string
          const jsonBlob = new Blob([JSON.stringify(value)], {
            type: "application/json",
          });
          formDataToSend.append(decamelize(key), jsonBlob, "workflow.json");
        } else {
          formDataToSend.append(decamelize(key), value as any);
        }
      });

      const { pipeline, smokeTestStream } = await createPipelineFromFormData(
        formDataToSend,
        user.id
      );
      router.push(
        `/pipelines/${pipeline.id}?streamId=${smokeTestStream.id}&validation=true`
      );
      toast.dismiss(toastId);
      toast.success("Pipeline created successfully");
    } catch (error) {
      console.error("Error details:", error);
      toast.dismiss(toastId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create pipeline: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthLoaded) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-lg">Create pipeline</h3>
        <LoaderCircleIcon className="w-8 h-8 animate-spin mt-4" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-lg">Create pipeline</h3>
        <LoggedOutComponent text="Sign in to create pipelines" />
      </div>
    );
  }

  // TODO: remove non-admin restriction when pre-validation is available
  if (!user?.email?.address?.endsWith("@livepeer.org")) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium">
          Pipeline creation is currently in closed beta.
        </h3>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg">Create pipeline</h3>
      <ScrollArea className="h-[90vh] max-w-xl w-full">
        {currentStep === 1 ? (
          <div className="space-y-4 mt-4 p-0.5">
            {/* Step 1 - Pipeline creation form */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Name</Label>
              <Input
                placeholder="e.g., Live Portrait Generator"
                id="name"
                onChange={(e) => handleChange(e, "name")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Version</Label>
              <Input
                value={(formData.version as string) || "1.0.0"}
                placeholder="e.g., 1.0.0 in format major.minor.patch"
                id="version"
                onChange={(e) => handleChange(e, "version")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Describe what your pipeline does and its use cases"
                id="description"
                className="h-24"
                onChange={(e) => handleChange(e, "description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Cover image</Label>
              <FileUploadDropzone
                placeholder="Upload cover image"
                id="coverImage"
                setFormData={setFormData}
                fileType={FileType.Image}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">ComfyUI JSON</Label>
              <FileUploadDropzone
                placeholder="Upload your ComfyUI workflow JSON"
                id="comfyJson"
                setFormData={setFormData}
                fileType={FileType.Json}
              />
            </div>

            <div className="flex">
              <Button className="mt-4 uppercase text-xs" onClick={handleNext}>
                Next
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
