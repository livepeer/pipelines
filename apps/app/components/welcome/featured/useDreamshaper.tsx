import { type ReactElement, useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getPipeline } from "@/app/api/pipelines/get";
import { upsertStream } from "@/app/api/streams/upsert";
import { toast } from "sonner";
import { updateParams } from "@/app/api/streams/update-params";
import { getStream } from "@/app/api/streams/get";
import { app } from "@/lib/env";
import {
  createSharedParams,
  getSharedParams,
} from "@/app/api/streams/share-params";
import { useSearchParams, usePathname } from "next/navigation";
import { useGatewayHost } from "@/hooks/useGatewayHost";

const DEFAULT_PIPELINE_ID = "pip_DRQREDnSei4HQyC8"; // Staging Dreamshaper ID
const DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS =
  "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Infra Email User ID

const DREAMSHAPER_PARAMS_STORAGE_KEY = "dreamshaper_latest_params";

const createDefaultValues = (pipeline: any) => {
  const inputs = pipeline.config.inputs;
  const primaryInput = inputs.primary;
  const advancedInputs = inputs.advanced;
  const allInputs = [primaryInput, ...advancedInputs];
  return allInputs.reduce((acc, input) => {
    acc[input.id] = input.defaultValue;
    return acc;
  }, {});
};

const processInputValues = (inputValues: any) => {
  return Object.fromEntries(
    Object.entries(inputValues).map(([key, value]) => {
      try {
        return [key, JSON.parse(value as string)];
      } catch {
        return [key, value];
      }
    }),
  );
};

export interface UpdateOptions {
  silent?: boolean;
}

const extractCommands = (promptText: string) => {
  // First, collect all commands and their values
  const commandRegex = /--([a-zA-Z0-9_-]+)(?:\s+(?:"([^"]*)"|([\S]*)))/g;
  const commands: Record<string, string> = {};
  let match;

  // Store all matches with their positions for later removal
  const matches = [];
  while ((match = commandRegex.exec(promptText)) !== null) {
    const commandName = match[1];
    // If there's a quoted value (match[2]) use that, otherwise use the single word value (match[3])
    const commandValue = match[2] !== undefined ? match[2] : match[3] || "true";
    commands[commandName] = commandValue;

    // Store the full match and its position
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  // Now build the cleaned prompt by removing the command portions
  let cleanedPrompt = promptText;

  // We need to remove matches from end to start to not mess up the indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start, end } = matches[i];
    cleanedPrompt =
      cleanedPrompt.substring(0, start) + " " + cleanedPrompt.substring(end);
  }

  // Clean up any extra spaces and trim
  cleanedPrompt = cleanedPrompt.replace(/\s+/g, " ").trim();

  return { cleanedPrompt, commands };
};

export function useDreamshaper() {
  const { user, ready } = usePrivy();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const pipelineId = searchParams.get("pipeline_id") || 
    process.env.NEXT_PUBLIC_SHOWCASE_PIPELINE_ID || 
    DEFAULT_PIPELINE_ID;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stream, setStream] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [inputValues, setInputValues] = useState<any>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);
  const [sharedParamsApplied, setSharedParamsApplied] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);

  const { gatewayHost, ready: gatewayHostReady } = useGatewayHost(
    stream?.id || null,
  );

  const storeParamsInLocalStorage = useCallback((params: any) => {
    try {
      localStorage.setItem(
        DREAMSHAPER_PARAMS_STORAGE_KEY,
        JSON.stringify(params),
      );
    } catch (error) {
      console.error("Error storing parameters in localStorage:", error);
    }
  }, []);

  const getParamsFromLocalStorage = useCallback(() => {
    try {
      const storedParams = localStorage.getItem(DREAMSHAPER_PARAMS_STORAGE_KEY);
      return storedParams ? JSON.parse(storedParams) : null;
    } catch (error) {
      console.error("Error retrieving parameters from localStorage:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const applySharedParams = async () => {
      const sharedId = searchParams.get("shared");

      if (!sharedId || sharedParamsApplied || !stream) {
        return;
      }

      try {
        const { data, error } = await getSharedParams(sharedId);

        if (error || !data) {
          return;
        }

        const sharedParams = data.params;

        let fullPromptText = sharedParams?.prompt?.["5"]?.inputs?.text || "";

        if (pipeline?.prioritized_params && sharedParams?.prompt) {
          const prioritizedParams =
            typeof pipeline.prioritized_params === "string"
              ? JSON.parse(pipeline.prioritized_params)
              : pipeline.prioritized_params;

          const defaultValues = createDefaultValues(pipeline);
          const processedDefaults = processInputValues(defaultValues);

          prioritizedParams.forEach((param: any) => {
            const commandId = param.name.toLowerCase().replace(/\s+/g, "-");
            const pathParts = param.path.split("/");
            const nodeId = param.nodeId;
            const actualField = pathParts[pathParts.length - 1];

            if (
              sharedParams.prompt[nodeId]?.inputs?.[actualField] !== undefined
            ) {
              const paramValue =
                sharedParams.prompt[nodeId].inputs[actualField];

              const defaultValue =
                processedDefaults?.prompt?.[nodeId]?.inputs?.[actualField];

              if (defaultValue === undefined || paramValue !== defaultValue) {
                fullPromptText += ` --${commandId} ${paramValue}`;
              }
            }
          });
        }

        setSharedPrompt(fullPromptText.trim());

        if (!gatewayHostReady) {
          return;
        }

        try {
          const response = await updateParams({
            body: sharedParams,
            host: gatewayHost as string,
            streamKey: stream.stream_key as string,
          });

          if (response.status == 200 || response.status == 201) {
            storeParamsInLocalStorage(sharedParams);
            setInputValues(sharedParams);
          }

          setSharedParamsApplied(true);
        } catch (error) {
          console.error("Error applying shared parameters:", error);
        }
      } catch (error) {
        console.error("Error in shared parameters process:", error);
      }
    };

    applySharedParams();
  }, [
    searchParams,
    stream,
    sharedParamsApplied,
    storeParamsInLocalStorage,
    gatewayHostReady,
    gatewayHost,
    pipeline,
  ]);

  useEffect(() => {
    if (searchParams.get("shared") || !stream || sharedParamsApplied) {
      return;
    }

    if (!gatewayHostReady) {
      return;
    }

    const applyStoredParams = async () => {
      const storedParams = getParamsFromLocalStorage();

      if (!storedParams) {
        return;
      }

      try {
        const response = await updateParams({
          body: storedParams,
          host: gatewayHost as string,
          streamKey: stream.stream_key as string,
        });

        if (response.status == 200 || response.status == 201) {
          setInputValues(storedParams);

          if (storedParams?.prompt?.["5"]?.inputs?.text) {
            setSharedPrompt(storedParams.prompt["5"].inputs.text);
          }
        }

        setSharedParamsApplied(true);
      } catch (error) {
        console.error("Error applying stored parameters:", error);
      }
    };

    applyStoredParams();
  }, [
    stream,
    searchParams,
    sharedParamsApplied,
    getParamsFromLocalStorage,
    gatewayHostReady,
    gatewayHost,
  ]);

  useEffect(() => {
    if (!ready) return;
    
    let isMounted = true;

    const fetchData = async () => {
      try {
        const pipeline = await getPipeline(pipelineId);
        if (!isMounted) return;
        setPipeline(pipeline);

        const inputValues = createDefaultValues(pipeline);
        const processedInputValues = processInputValues(inputValues);
        setInputValues(processedInputValues);

        const currentUserId =
          user?.id ?? DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS;

        const { data: stream, error } = await upsertStream(
          {
            pipeline_id: pipeline.id,
            pipeline_params: processedInputValues,
          },
          currentUserId,
        );

        if (error) {
          toast.error(`Error creating stream for playback ${error}`);
          return;
        }

        if (!isMounted) return;
        setStream(stream);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [pathname, ready, user]);

  const handleUpdate = useCallback(
    async (prompt: string, options?: UpdateOptions) => {
      if (!stream) {
        console.error("No stream found, aborting update");
        if (!options?.silent) {
          toast.error("No stream found");
        }
        return;
      }

      setUpdating(true);
      const streamId = stream.id;
      const streamKey = stream.stream_key;
      let toastId;
      if (!options?.silent) {
        toastId = toast.loading("Updating the stream with prompt...");
      }

      try {
        const { data: streamData, error: streamError } = await getStream(streamId);

        if (streamError) {
          console.error("Error fetching stream:", streamError);
          if (!options?.silent) {
            toast.error("Error updating parameters", { id: toastId });
          }
          return;
        }

        // Fetching the pipeline again to ensure we have the latest values
        const freshPipeline = await getPipeline(pipeline.id);
        
        const defaultValues = createDefaultValues(freshPipeline);
        const updatedInputValues = processInputValues(defaultValues);

        const { cleanedPrompt, commands } = extractCommands(prompt);

        if (!updatedInputValues.prompt) {
          updatedInputValues.prompt = {};
        }
        if (!updatedInputValues.prompt["5"]) {
          updatedInputValues.prompt["5"] = { inputs: {} };
        }
        if (!updatedInputValues.prompt["5"].inputs) {
          updatedInputValues.prompt["5"].inputs = {};
        }
        
        updatedInputValues.prompt["5"].inputs.text = cleanedPrompt;

        if (freshPipeline?.prioritized_params && Object.keys(commands).length > 0) {
          const prioritizedParams =
            typeof freshPipeline.prioritized_params === "string"
              ? JSON.parse(freshPipeline.prioritized_params)
              : freshPipeline.prioritized_params;

          prioritizedParams.forEach((param: any) => {
            const commandId = param.name.toLowerCase().replace(/\s+/g, "-");

            if (commands[commandId]) {
              const pathParts = param.path.split("/");
              const nodeId = param.nodeId;
              const actualField = pathParts[pathParts.length - 1];

              if (!updatedInputValues.prompt[nodeId]) {
                updatedInputValues.prompt[nodeId] = { inputs: {} };
              }
              if (!updatedInputValues.prompt[nodeId].inputs) {
                updatedInputValues.prompt[nodeId].inputs = {};
              }

              let value = commands[commandId];

              if (param.widget === "number" || param.widget === "slider") {
                let numValue = parseFloat(value);
                if (
                  param.widgetConfig?.min !== undefined &&
                  numValue < param.widgetConfig.min
                ) {
                  numValue = param.widgetConfig.min;
                }
                if (
                  param.widgetConfig?.max !== undefined &&
                  numValue > param.widgetConfig.max
                ) {
                  numValue = param.widgetConfig.max;
                }

                updatedInputValues.prompt[nodeId].inputs[actualField] = numValue;
              } else if (param.widget === "checkbox") {
                updatedInputValues.prompt[nodeId].inputs[actualField] =
                  value.toLowerCase() === "true" || value === "1";
              } else {
                updatedInputValues.prompt[nodeId].inputs[actualField] = value;
              }
            }
          });
        }

        storeParamsInLocalStorage(updatedInputValues);
        setInputValues(updatedInputValues);

        if (!streamData?.gateway_host) {
          console.error("No gateway host found in stream data");
          if (!options?.silent) {
            toast.error("No gateway host found in stream data");
          }
          return;
        }

        const response = await updateParams({
          body: updatedInputValues,
          host: streamData?.gateway_host as string,
          streamKey: streamKey as string,
        });

        if (response.status == 200 || response.status == 201) {
          if (!options?.silent) {
            toast.success("Stream updated successfully", { id: toastId });
          }
        } else {
          if (!options?.silent) {
            toast.error("Error updating stream with prompt", { id: toastId });
          }
        }
      } catch (error) {
        console.error("Error in handleUpdate:", error);
        if (!options?.silent) {
          toast.error("An unexpected error occurred", { id: toastId });
        }
      } finally {
        setUpdating(false);
      }
    },
    [stream, pipeline, storeParamsInLocalStorage]
  );

  const createShareLink = useCallback(async () => {
    if (!stream) {
      console.error("No stream found, cannot create share link");
      return { error: "No stream found", url: null };
    }

    try {
      const storedParams = getParamsFromLocalStorage();

      if (!storedParams) {
        console.error("No parameters found in localStorage");
        return { error: "No parameters available to share", url: null };
      }

      const { data, error } = await createSharedParams(
        storedParams,
        user?.id ?? DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS,
        pipeline.id,
      );

      if (error) {
        return { error, url: null };
      }

      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("shared", data.id);

      return { error: null, url: shareUrl.toString() };
    } catch (error) {
      console.error("Error in createShareLink:", error);
      return { error: String(error), url: null };
    }
  }, [stream, user, pipeline, getParamsFromLocalStorage]);

  return {
    stream,
    outputPlaybackId: stream?.output_playback_id,
    streamUrl: stream ? getStreamUrl(stream.stream_key, searchParams) : null,
    pipeline,
    handleUpdate,
    loading,
    fullResponse,
    updating,
    createShareLink,
    sharedPrompt,
  };
}

function getStreamUrl(
  streamKey: string,
  searchParams: URLSearchParams,
): string {
  const customWhipServer = searchParams.get("whipServer");

  if (customWhipServer) {
    if (customWhipServer.includes("<STREAM_KEY>")) {
      return customWhipServer.replace("<STREAM_KEY>", streamKey);
    }
    return `${customWhipServer}${streamKey}/whip`;
  }

  return `${app.whipUrl}${streamKey}/whip`;
}
