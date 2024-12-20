import React, {useState, useEffect, useImperativeHandle, forwardRef} from "react";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Input } from "@repo/design-system/components/ui/input";
import { Switch } from "@repo/design-system/components/ui/switch";
import { cn } from "@repo/design-system/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import Search from "../header/search";
import {ExternalToast, toast} from "sonner";
import ComfyUIParamsEditor from "@/components/stream/comfyui-param-editor";

const StreamForm = forwardRef(
    (
        { stream }: { stream?: any | null },
        ref: React.Ref<any>
    ) => {

      const [inputValues, setInputValues] = useState<Record<string, any>>(() =>
          stream?.pipeline_params || {}
      );
      const [isOpen, setIsOpen] = useState(true);
      const [selectedPipeline, setSelectedPipeline] = useState<any | null>(stream?.pipelines || {});
      const [selectedStream, setSelectedStream] = useState<any | null>(stream || "");
      const [inputs, setInputs] = useState<Record<string, any>>(selectedPipeline?.config?.inputs || {})

      useEffect(() => {
        const defaultValues = createDefaultValues();
        setInputValues(defaultValues);
      }, [inputs]);

      useEffect(() => {
        setInputs(selectedPipeline?.config?.inputs);
      }, [selectedPipeline]);

      const toastOptions: ExternalToast = {
        position: "top-center",
        richColors: true,
      };

      const validateJson = (json: any) => {
        try {
          typeof json !== "object"
              ? JSON.parse(json as string)
              : JSON.stringify(json);
          return {isValid: true, message: null};
        } catch (error: any) {
          return {isValid: false, message: error.message};
        }
      }

      const handleInputChange = (id: string, value: any) => {
        if (['name', 'output_stream_url'].includes(id)) {
          setSelectedStream((prev: any) => ({
            ...prev,
            [id]: value
          }));
        } else {
          setInputValues((prev) => ({
            ...prev,
            [id]: value,
          }));
        }
      };

      useImperativeHandle(ref, () => ({
        getFormData: () => ({
          ...selectedStream,
          pipelines: selectedPipeline,
          pipeline_id: selectedPipeline.id,
          pipeline_params: inputValues,
        }),
        isFormValid: (): boolean => {
          if (!selectedStream.name || !selectedPipeline.id) {
            toast.error("Stream must have a name and a pipeline", toastOptions);
            return false;
          }

          if (!selectedStream.output_stream_url) {
            toast.error("Stream must have a Destination URL", toastOptions);
            return false;
          }

          try {
            new URL(selectedStream.output_stream_url);
          } catch (e) {
            toast.error(
                "The destination URL provided is invalid. It must be a valid URL.",
                toastOptions
            );
            return false;
          }

          // validate that inputValues is a valid JSON
          const {isValid, message} = validateJson(inputValues);
          if (!isValid) {
              toast.error(
                  `Invalid JSON provided in the form: ${message}`,
                  toastOptions
              );
              return false;
          }
          return true;
        }
      }));

      const iterateInputs = (lambda:any) => {
        const primaryInput = inputs?.primary;
        const advancedInputs = inputs?.advanced || [];
        const allInputs = [primaryInput, ...advancedInputs];
        if (allInputs.length === 0) return {};
        if (typeof lambda !== 'function') {
          throw new Error('Invalid function provided to iterateInputs');
        }
        return allInputs.reduce(lambda, {});
      };

      const createDefaultValues = () => {
        return iterateInputs((acc:any, input:any) => {
          if (!input?.id) return acc;
          // If there is an existing stream and the pipeline is same as the selectedPipeline,
          // use the values from the stream.pipeline_params object instead of the default values
          if (selectedStream && selectedStream?.pipelines === selectedPipeline && selectedStream?.pipeline_params) {
            // if the field's defaultValue is not a string, we assume this is a json field,
            // and we need to keep it an object for the form to behave
            acc[input.id] = selectedStream?.pipeline_params?.[input.id];
            return acc;
          }
          acc[input.id] = input.defaultValue;
          return acc;
        });
      };

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
          case "switch":
            return (
                <Switch
                    checked={inputValues[input.id]}
                    onCheckedChange={(checked) => handleInputChange(input.id, checked)}
                />
            );
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

      return (
          <div className="flex flex-col gap-4 mt-5">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-2 max-w-md">
                <Label className="text-muted-foreground">
                      Pipeline
                  </Label>
                <Search onPipelineSelect={setSelectedPipeline} pipeline={selectedPipeline}/>
              </div>
            </div>

            {(selectedStream?.pipelines || selectedPipeline) &&
                <>
                  <div className="flex flex-col gap-2 max-w-md">
                    <Label className="text-muted-foreground">
                      Stream Name
                    </Label>
                    <Input
                        type="text"
                        placeholder={"My First AI Stream"}
                        value={selectedStream?.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  {stream?.stream_key && (
                      <div className="flex flex-col gap-2 max-w-md">
                        <Label className="text-muted-foreground">
                          Stream Key
                        </Label>
                        {stream?.stream_key}
                      </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-md">
                    <Label className="text-muted-foreground">
                      Stream Destination URL
                    </Label>
                    <Input
                        type="text"
                        placeholder={"E.g., rtmp://twitch.tv/app/<stream_key>"}
                        value={selectedStream?.output_stream_url}
                        onChange={(e) => handleInputChange('output_stream_url', e.target.value)}
                    />
                    {/* <RestreamDropdown onOutputStreamsChange={setStreamOutputs} initialStreams={selectedStream?.restream_config} /> */}
                  </div>
                </>
            }
            {/* Primary Input (Prompt) */}
            {selectedPipeline.type == "comfyui" ? (
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">
                    ComfyUI Parameters
                  </Label>
                  <ComfyUIParamsEditor
                      value={inputValues["prompt"]}
                      onChange={(value) => handleInputChange("prompt", value)}
                  />
                </div>
            ) : inputs?.primary && inputs?.primary.length > 0 && (
                <div className="flex flex-col gap-2 max-w-md">
                  <Label className="text-muted-foreground">
                    {inputs?.primary?.label}
                  </Label>
                  {renderInput(inputs?.primary)}
                </div>
            )}

            {/* Advanced Settings Collapsible */}
            {inputs?.advanced && inputs.advanced.length > 0 && (
                <div className="flex flex-col gap-2 max-w-2xl">
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
                          <ScrollArea className="h-[500px] rounded-md border">
                            <div className="p-4 space-y-4">
                              {(inputs?.advanced || [])
                                  .filter((input: any) => input.id !== "prompt")
                                  .map((input: any) => (
                                      <div
                                          key={input.id}
                                          className={cn({
                                            "flex flex-col gap-2 max-w-md": input.type !== "switch",
                                            "flex flex-row justify-between items-center max-w-md":
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
          </div>
      );
    });

export default StreamForm;