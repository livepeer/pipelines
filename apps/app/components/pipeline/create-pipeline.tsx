"use client";

import LoggedOutComponent from "@/components/modals/logged-out";
import { usePrivy } from "@privy-io/react-auth";
import { Input } from "@repo/design-system/components/ui/input";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import FileUploadDropzone from "./json-upload";
import { Label } from "@repo/design-system/components/ui/label";
import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { decamelize } from "humps";

export default function CreatePipeline() {
  const { authenticated } = usePrivy();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string
  ) => {
    setFormData((prev) => ({ ...prev, [id]: e.target.value }));
    console.log(formData);
  };
  const handleSubmit = () => {
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(decamelize(key), value as any);
    });
    const formDataObject = Object.fromEntries(formDataToSend.entries());
    console.log(formDataObject);
  };

  if (!authenticated) {
    return <LoggedOutComponent text="Sign in to create pipelines" />;
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg">Create pipeline</h3>
      <ScrollArea className="h-[90vh] max-w-xl">
        <div className="space-y-4 mt-4 p-0.5">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Name</Label>
            <Input
              placeholder="e.g., Live Portrait Generator"
              id="name"
              onChange={(e) => handleChange(e, "name")}
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
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">ComfyUI JSON</Label>
            <FileUploadDropzone
              placeholder="Upload your ComfyUI workflow JSON"
              id="comfyJson"
              setFormData={setFormData}
            />
          </div>
          <div className="flex">
            <Button className="mt-4 uppercase text-xs" onClick={handleSubmit}>
              Create
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
