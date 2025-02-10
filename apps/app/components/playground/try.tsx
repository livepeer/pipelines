"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { upsertStream } from "@/app/api/streams/upsert";
import { usePrivy } from "@privy-io/react-auth";
import { Input } from "@repo/design-system/components/ui/input";
import { Switch } from "@repo/design-system/components/ui/switch";
import { Slider } from "@repo/design-system/components/ui/slider";
import { cn } from "@repo/design-system/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Copy } from "lucide-react";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Button } from "@repo/design-system/components/ui/button";
import { toast } from "sonner";
import { updateParams } from "@/app/api/streams/update-params";
import { app } from "@/lib/env";
import { getStream } from "@/app/api/streams/get";
import track from "@/lib/track";
import { BroadcastWithControls } from "./broadcast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import ComfyUIParamsEditor from "@/components/stream/comfyui-param-editor";
import { useStreamStatus } from "@/hooks/useStreamStatus";

import { useTrialTimer } from "@/hooks/useTrialTimer";
import { TrialExpiredModal } from "@/components/modals/trial-expired-modal";
import { useRouter } from "next/navigation";

type BaseParam = {
  nodeId: string;
  field: string;
  name: string;
  description: string;
  path: string;
  classType: string;
};

type TextWidget = {
  widget: "text";
  widgetConfig?: {}; 
};

type TextAreaWidget = {
  widget: "textarea";
  widgetConfig?: {}; 
};

type NumberWidget = {
  widget: "number";
  widgetConfig?: {
    min?: number;
    max?: number;
    step?: number;
  };
};

type SliderWidget = {
  widget: "slider";
  widgetConfig: {
    min: number;
    max: number;
    step: number;
  };
};

type SelectWidget = {
  widget: "select";
  widgetConfig: {
    options: { label: string; value: string }[];
  };
};

type SwitchWidget = {
  widget: "checkbox";
  widgetConfig?: {};
};

export type PrioritizedParam = BaseParam &
  (TextWidget | TextAreaWidget | NumberWidget | SliderWidget | SelectWidget | SwitchWidget);

export default function Try({
  setStreamInfo,
  pipeline,
}: {
  setStreamInfo: (streamInfo: any) => void;
  pipeline: any;
}): JSX.Element {
  const { user, authenticated, login } = usePrivy();
  const router = useRouter();
  const [source, setSource] = useState<string>("");
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [gatewayHost, setGatewayHost] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [streamKilled, setStreamKilled] = useState(false);
  const { timeRemaining } = useTrialTimer();

  useEffect(() => {
    const handleTrialExpired = () => {
      console.log("Trial expired on Try page");
      setStreamKilled(true);
    };
    window.addEventListener("trialExpired", handleTrialExpired);
    return () => window.removeEventListener("trialExpired", handleTrialExpired);
  }, []);

  const [debugOpen, setDebugOpen] = useState(false);

  const isAdmin = user?.email?.address?.endsWith("@livepeer.org");

  const { status, fullResponse, loading: statusLoading, error: statusError } = useStreamStatus(streamId || "", false);

  const handleInputChange = (id: string, value: any) => {
    const newValues = {
      ...inputValues,
      [id]: value,
    };
    setInputValues(newValues);

    const hasAnyChange = Object.keys(newValues).some(
      (key) => newValues[key] !== initialValues[key]
    );
    setHasChanges(hasAnyChange);
    // Track parameter change
    track(
      "inputs_parameter_changed",
      {
        parameter_id: id,
      },
      user || undefined
    );
  };

  const handleUpdate = async () => {
    if (!streamKey || !streamId) return;

    const { data, error } = await getStream(streamId);

    if (error) {
      toast.error("Error updating parameters");
      return;
    }

    if (!data?.gateway_host) {
      toast("No gateway host found");
      return;
    }

    const response = await updateParams({
      body: inputValues,
      host: data.gateway_host as string,
      streamKey: streamKey as string,
    });

    if (response.status == 200 || response.status == 201) {
      toast.success("Parameters updated successfully");
    } else {
      toast.error("Error updating parameters");
    }
  };

  const handleRun = async (): Promise<void> => {
    const processedInputValues = Object.fromEntries(
      Object.entries(inputValues).map(([key, value]) => {
        try {
          return [key, JSON.parse(value as string)];
        } catch {
          return [key, value];
        }
      })
    );

    const { data: stream, error } = await upsertStream(
      {
        pipeline_id: pipeline.id,
        pipeline_params: processedInputValues,
      },
      user?.id ?? "did:privy:cm4x2cuiw007lh8fcj34919fu" // Dummy user id for non-authenticated users
    );

    if (error) {
      toast.error(`Error creating stream for playback ${error}`);
      return;
    }
    setStreamId(stream.id);
    setStreamInfo(stream);
    setStreamUrl(`${app.whipUrl}${stream.stream_key}/whip`);
    setStreamKey(stream.stream_key);
    console.log("stream", stream);
    setGatewayHost(stream.gateway_host);
  };

  const inputs = pipeline.config.inputs;

  const createDefaultValues = () => {
    const primaryInput = inputs.primary;
    const advancedInputs = inputs.advanced;
    const allInputs = [primaryInput, ...advancedInputs];
    return allInputs.reduce((acc, input) => {
      acc[input.id] = input.defaultValue;
      return acc;
    }, {});
  };

  useEffect(() => {
    const defaultValues = createDefaultValues();
    setInputValues(defaultValues);
    setInitialValues(defaultValues);
  }, [pipeline]);

  useEffect(() => {
    if (!streamId && Object.keys(inputValues).length > 0) {
      handleRun();
    }
  }, [inputValues, streamId]);

  const renderInput = (input: any) => {
    switch (input.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={input.placeholder}
            value={inputValues[input.id] || ""}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
          />
        );
      case "textarea":
        return (
          <Textarea
            className="h-44"
            defaultValue={
              typeof input.defaultValue === "string"
                ? input.defaultValue
                : JSON.stringify(input.defaultValue, null, 2)
            }
            placeholder={input.placeholder}
            value={
              typeof inputValues[input.id] === "string"
                ? inputValues[input.id]
                : JSON.stringify(inputValues[input.id], null, 2) || ""
            }
            onChange={(e) => handleInputChange(input.id, e.target.value)}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            min={input.min}
            max={input.max}
            step={input.step}
            value={inputValues[input.id]}
            onChange={(e) =>
              handleInputChange(input.id, parseFloat(e.target.value))
            }
          />
        );
      case "switch": {
        const defaultVal = initialValues[input.id];
        const isNumeric = typeof defaultVal === "number";
        const current = inputValues[input.id];
        const checkedValue =
          typeof current === "boolean" ? current : Boolean(current);
        return (
          <Switch
            checked={checkedValue}
            onCheckedChange={(checked: boolean) => {
              if (isNumeric) {
                handleInputChange(input.id, checked ? 1 : 0);
              } else {
                handleInputChange(input.id, checked);
              }
            }}
          />
        );
      }
      case "select":
        return (
          <Select
            value={inputValues[input.id]}
            onValueChange={(value) => handleInputChange(input.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={input.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {input.options.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "slider":
        return (
          <Slider
            value={[Number(inputValues[input.id]) || 0]}
            min={input.min}
            max={input.max}
            step={input.step}
            onValueChange={([val]) => handleInputChange(input.id, val)}
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder={input.placeholder}
            value={inputValues[input.id] || ""}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
          />
        );
    }
  };

  const handleCopyLogs = () => {
    if (fullResponse) {
      navigator.clipboard.writeText(JSON.stringify(fullResponse, null, 2));
      toast.success("Logs copied to clipboard");
    }
  };

  return (
    <>
      <div className={streamKilled ? "opacity-50 pointer-events-none" : ""}>
        <div className="relative">
          <div className="flex justify-end h-10">
            {streamId && (
              <>
                <Button onClick={handleUpdate} disabled={!hasChanges}>
                  Save Parameters
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="ml-2"
                    onClick={() => setDebugOpen(!debugOpen)}
                  >
                    {debugOpen ? "Close Debug" : "Open Debug"}
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Source</Label>
              <Select
                defaultValue="Webcam"
                value={source}
                disabled
                onValueChange={setSource}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Webcam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Webcam">Webcam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inputs.primary && (
              <>
                {pipeline.type == "comfyui" ? (
                  <div className="flex flex-col gap-4">
                    <Label className="text-muted-foreground">
                      ComfyUI Parameters
                    </Label>
                    
                    {pipeline.prioritized_params && (
                      <div className="space-y-4 border rounded-lg p-4 mb-4">
                        <Label className="text-muted-foreground">Quick Settings</Label>
                        {(
                          typeof pipeline.prioritized_params === "string"
                            ? JSON.parse(pipeline.prioritized_params)
                            : pipeline.prioritized_params
                        ).map((param: PrioritizedParam) => {
                          const currentJson =
                            typeof inputValues["prompt"] === "string"
                              ? JSON.parse(inputValues["prompt"])
                              : inputValues["prompt"];
                          const currentValue =
                            currentJson?.[param.nodeId]?.inputs?.[param.field];

                          const handlePrioritizedParamChange = (newValue: any) => {
                            const updatedJson = JSON.parse(JSON.stringify(inputValues["prompt"]));
                            
                            if (!updatedJson[param.nodeId]) {
                              updatedJson[param.nodeId] = { inputs: {} };
                            }
                            if (!updatedJson[param.nodeId].inputs) {
                              updatedJson[param.nodeId].inputs = {};
                            }
                            
                            updatedJson[param.nodeId].inputs[param.field] = newValue;
                            handleInputChange("prompt", updatedJson);
                          };

                          return (
                            <div key={param.path} className="space-y-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Label>{param.name}</Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-popover text-popover-foreground border border-border">
                                      <p>
                                        {param.classType}.inputs.{param.field}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                {param.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {param.description}
                                  </span>
                                )}
                              </div>

                              {param.widget === "slider" ? (
                                <Slider
                                  value={[Number(currentValue) || 0]}
                                  min={param.widgetConfig!.min}
                                  max={param.widgetConfig!.max}
                                  step={param.widgetConfig!.step}
                                  onValueChange={([val]) =>
                                    handlePrioritizedParamChange(val)
                                  }
                                />
                              ) : param.widget === "number" ? (
                                <Input
                                  type="number"
                                  value={currentValue}
                                  onChange={(e) =>
                                    handlePrioritizedParamChange(
                                      Number(e.target.value)
                                    )
                                  }
                                  min={param.widgetConfig!.min}
                                  max={param.widgetConfig!.max}
                                  step={param.widgetConfig!.step}
                                />
                              ) : param.widget === "select" ? (
                                <Select
                                  value={String(currentValue)}
                                  onValueChange={handlePrioritizedParamChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {param.widgetConfig.options?.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : param.widget === "checkbox" ? (
                                <Switch
                                  checked={
                                    typeof currentValue === "boolean"
                                      ? currentValue
                                      : Boolean(currentValue)
                                  }
                                  onCheckedChange={(checked: boolean) => {
                                    const newVal =
                                      typeof currentValue === "number"
                                        ? (checked ? 1 : 0)
                                        : checked;
                                    handlePrioritizedParamChange(newVal);
                                  }}
                                />
                              ) : (
                                <Input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) =>
                                    handlePrioritizedParamChange(e.target.value)
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <ComfyUIParamsEditor
                      value={inputValues["prompt"]}
                      onChange={(value) => handleInputChange("prompt", value)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Label className="text-muted-foreground">
                      {inputs.primary.label}
                    </Label>
                    {renderInput(inputs.primary)}
                  </div>
                )}
              </>
            )}

            {inputs.advanced.length > 0 && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                  Advanced Settings
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ScrollArea className="h-[400px]  border">
                        <div className="p-4 space-y-4">
                          {inputs.advanced
                            .filter((input: any) => input.id !== "prompt")
                            .map((input: any) => (
                              <div
                                key={input.id}
                                className={cn({
                                  "flex flex-col gap-2": true,
                                  "flex flex-row justify-between items-center":
                                    input.type === "switch",
                                })}
                              >
                                <Label className="text-muted-foreground">
                                  {input.label}
                                </Label>
                                {renderInput(input)}
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Video Source</Label>
              <div className="flex flex-row h-[300px] w-full bg-sidebar rounded-2xl items-center justify-center overflow-hidden relative">
                {streamUrl ? (
                  <BroadcastWithControls ingestUrl={streamUrl} />
                ) : (
                  <p className="text-muted-foreground">
                    Waiting for webcam to start...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {streamKilled && (
        <TrialExpiredModal 
          open={true} 
          onOpenChange={(open) => {
            if (!open) {
              router.push('/explore');
            }
          }} 
        />
      )}

      {debugOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-gray-800/80 text-white p-4 shadow-lg z-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Debug Status</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLogs}>
                <Copy className="mr-2" /> Copy Logs
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDebugOpen(false)}>
                Close
              </Button>
            </div>
          </div>
          <div>
            <p>
              <strong>Stream ID:</strong> {streamId || "N/A"}
            </p>
            <pre className="text-xs whitespace-pre-wrap">
              {fullResponse ? JSON.stringify(fullResponse, null, 2) : "Loading..."}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
