"use client";

import React, { useEffect } from "react";
import { XIcon, Upload } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { usePrivy } from "@privy-io/react-auth";
import LoggedOut from "./logged-out";
import { useRouter, useSearchParams } from "next/navigation";
import track from "@/lib/track";
import {
  ScrollArea,
  ScrollBar,
} from "@repo/design-system/components/ui/scroll-area";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import Link from "next/link";

const FORM_FIELDS = {
  BASIC: [
    {
      section: "Pipeline Details",
      fields: [
        {
          id: "name",
          label: "Pipeline Name",
          type: "input",
          placeholder: "e.g., Live Portrait Generator",
        },
        {
          id: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe what your pipeline does and its use cases",
          className: "h-24",
        },
        {
          id: "isPrivate",
          label: "Make this pipeline private",
          type: "checkbox",
          defaultValue: true,
        },
        {
          id: "coverImage",
          label: "Cover Image",
          type: "upload",
          placeholder: "Upload cover image or it will be auto-generated",
        },
        {
          id: "pipelineType",
          label: "Pipeline Type",
          type: "select",
          placeholder: "Select pipeline type",
          defaultValue: "comfyui",
          options: [
            { value: "comfyui", label: "ComfyUI-based" },
            {
              value: "custom",
              label: "Custom Python (Coming Soon)",
              disabled: true,
            },
          ],
        },
      ],
    },
    {
      section: "Integration",
      fields: [
        {
          id: "comfyJson",
          label: "ComfyUI JSON",
          type: "upload",
          placeholder: "Upload your ComfyUI workflow JSON",
        },
        {
          id: "repository",
          label: "Sample Code Repository",
          type: "input",
          placeholder: "GitHub repository URL",
        },
      ],
    },
    {
      section: "Sample Input",
      fields: [
        {
          id: "video",
          label: "Sample Input Video",
          type: "upload",
          placeholder: "Upload a sample input video",
        },
      ],
    },
  ],
  MODEL_CARD: [
    {
      section: "Model Information",
      fields: [
        {
          id: "baseModel",
          label: "Base Model",
          type: "input",
          placeholder: "e.g., organization/model-name",
        },
        {
          id: "modelType",
          label: "Model Type",
          type: "select",
          placeholder: "Select model type",
          options: [
            { value: "base", label: "Base Model" },
            { value: "finetune", label: "Fine-tuned Model" },
            { value: "adapter", label: "Adapter (LoRA, PEFT)" },
            { value: "quantized", label: "Quantized Model" },
          ],
        },
      ],
    },
    {
      section: "Training & Evaluation",
      fields: [
        {
          id: "trainingDatasets",
          label: "Training Datasets",
          type: "input",
          placeholder: "dataset1, dataset2",
        },
        {
          id: "evaluationResults",
          label: "Evaluation Results",
          type: "textarea",
          placeholder:
            "Task: text-generation\nDataset: ai2_arc\nMetric: AI2 Reasoning Challenge\nValue: 64.59",
          className: "h-24",
        },
      ],
    },
    {
      section: "License & Usage",
      fields: [
        {
          id: "license",
          label: "License",
          type: "select",
          placeholder: "Select license",
          options: [
            { value: "apache-2.0", label: "Apache 2.0" },
            { value: "mit", label: "MIT" },
            { value: "gpl", label: "GPL" },
            { value: "other", label: "Other (Custom)" },
          ],
        },
        {
          id: "intendedUse",
          label: "Intended Use",
          type: "textarea",
          placeholder: "Describe the intended uses and potential limitations",
          className: "h-24",
        },
      ],
    },
    {
      section: "Categorization",
      fields: [
        {
          id: "tags",
          label: "Tags",
          type: "input",
          placeholder: "e.g., computer-vision, real-time, stable-diffusion",
        },
      ],
    },
  ],
};

const FormField = ({ field }: { field: any }) => {
  const commonProps = {
    id: field.id,
    placeholder: field.placeholder,
    className: field.className,
  };

  switch (field.type) {
    case "input":
      return <Input {...commonProps} />;
    case "textarea":
      return <Textarea {...commonProps} />;
    case "select":
      return (
        <Select defaultValue={field.defaultValue}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option: any) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "upload":
      return (
        <div className="border-2 border-dashed  p-4 text-center cursor-pointer hover:bg-accent/50">
          <Upload className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{field.placeholder}</p>
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center justify-between space-x-2">
          <Label className="text-muted-foreground">{field.label}</Label>
          <Checkbox {...commonProps} defaultChecked={field.defaultValue} />
        </div>
      );
    default:
      return null;
  }
};

const FormSection = ({ section, fields }: { section: string; fields: any }) => (
  <div className="space-y-4 p-0.5">
    <h5 className="font-medium">{section}</h5>
    {fields.map((field: any) => (
      <div key={field.id} className="space-y-1.5">
        {field.type !== "checkbox" && (
          <Label className="text-muted-foreground">{field.label}</Label>
        )}
        <FormField field={field} />
      </div>
    ))}
  </div>
);

export default function CreatePipeline({ open }: { open: boolean }) {
  if (!open) return null;

  const { authenticated, user } = usePrivy();
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeModal = () => {
    const { tab, ...params } = Object.fromEntries(searchParams.entries());
    const newParams = new URLSearchParams(params).toString();
    router.replace(`${window.location.pathname}?${newParams}`);
  };

  useEffect(() => {
    if (open) {
      track(
        "create_pipeline_modal_opened",
        {
          is_authenticated: authenticated,
          modal_state: "opened",
        },
        user || undefined
      );
    }
  }, [open, authenticated, user]);

  if (!authenticated) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium">Create a pipeline</h4>
            <p className="text-sm text-muted-foreground">
              Create and publish your AI pipeline
            </p>
          </div>
          <XIcon
            onClick={closeModal}
            className="w-5 h-5 cursor-pointer"
            style={{ strokeWidth: 1.5 }}
          />
        </div>
        <LoggedOut text="Sign in to create pipelines" />
      </div>
    );
  }

  const renderContent = (fields: any) => (
    <div className="space-y-6">
      {fields.map((section: any, index: number) => (
        <FormSection
          key={`${section.section}-${index}`}
          section={section.section}
          fields={section.fields}
        />
      ))}
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between relative">
        <div>
          <h4 className="text-lg font-medium">Create a pipeline</h4>
          <p className="text-sm text-muted-foreground">
            Create and publish your AI pipeline
          </p>
        </div>
        <XIcon
          className="w-5 h-6 cursor-pointer"
          style={{ strokeWidth: 1.5 }}
          onClick={closeModal}
        />
      </div>
      <div className="flex justify-center h-[calc(100vh-15rem)] items-center flex-col space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Pipeline creation is currently in closed beta. Sign up for the
          waitlist today to be among the first to know when it becomes available
          in early 2025!
        </p>
        <Button asChild>
          <Link href="https://waitlist.livepeer.org/" target="_blank">
            Sign up for the waitlist
          </Link>
        </Button>
      </div>
      {/* <ScrollArea className="h-[90vh]">
        <Tabs defaultValue="basic" className="my-6  h-full">
          <TabsList className="grid w-full grid-cols-2 my-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="model-card">Model Card</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 ">
            {renderContent(FORM_FIELDS.BASIC)}
          </TabsContent>
          <TabsContent value="model-card" className="space-y-6">
            {renderContent(FORM_FIELDS.MODEL_CARD)}
          </TabsContent>

          <Button disabled className="w-full my-6">
            Create Pipeline
          </Button>
        </Tabs>
      </ScrollArea> */}
    </div>
  );
}
