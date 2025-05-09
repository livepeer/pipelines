import { getPipeline } from "@/app/api/pipelines/get";
import { getStream } from "@/app/api/streams/get";
import {
  createSharedParams,
  getSharedParams,
} from "@/app/api/streams/share-params";
import { updateParams } from "@/app/api/streams/update-params";
import { Stream, upsertStream } from "@/app/api/streams/upsert";
import { useGatewayHost } from "@/hooks/useGatewayHost";
import { getAppConfig } from "@/lib/env";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { useStreamStatus } from "./useStreamStatus";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";
import { usePromptStore } from "@/hooks/usePromptStore";
import { useCapacityCheck } from "@/hooks/useCapacityCheck";
import { usePromptVersionStore } from "./usePromptVersionStore";

export const DEFAULT_PIPELINE_ID = "pip_DRQREDnSei4HQyC8"; // Staging Dreamshaper ID
export const DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS =
  "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Infra Email User ID

export const DREAMSHAPER_PARAMS_STORAGE_KEY = "dreamshaper_latest_params";
export const DREAMSHAPER_PARAMS_VERSION_KEY = "dreamshaper_params_version";

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

export const getStreamUrl = (
  streamKey: string,
  searchParams: URLSearchParams,
  storedWhipUrl?: string | null,
): string => {
  const customWhipServer = searchParams.get("whipServer");
  const customOrchestrator = searchParams.get("orchestrator");

  const app = getAppConfig(searchParams);

  if (customWhipServer) {
    if (customWhipServer.includes("<STREAM_KEY>")) {
      return addOrchestratorParam(
        customWhipServer.replace("<STREAM_KEY>", streamKey),
        customOrchestrator,
      );
    }
    return addOrchestratorParam(
      `${customWhipServer}${streamKey}/whip`,
      customOrchestrator,
    );
  }

  return addOrchestratorParam(
    `${app.newWhipUrl}${streamKey}/whip`,
    customOrchestrator,
  );
};

const addOrchestratorParam = (
  url: string,
  orchestrator: string | null,
): string => {
  if (orchestrator) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("orchestrator", orchestrator);
    return urlObj.toString();
  }
  return url;
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

const storeParamsInLocalStorage = (params: any, pipelineVersion: string) => {
  try {
    localStorage.setItem(
      DREAMSHAPER_PARAMS_STORAGE_KEY,
      JSON.stringify(params),
    );
    localStorage.setItem(DREAMSHAPER_PARAMS_VERSION_KEY, pipelineVersion);
  } catch (error) {
    console.error("Error storing parameters in localStorage:", error);
  }
};

const getParamsFromLocalStorage = (currentPipelineVersion: string) => {
  try {
    const storedVersion = localStorage.getItem(DREAMSHAPER_PARAMS_VERSION_KEY);
    const storedParams = localStorage.getItem(DREAMSHAPER_PARAMS_STORAGE_KEY);

    // If versions don't match or stored version doesn't exist, clear storage and return null
    if (!storedVersion || storedVersion !== currentPipelineVersion) {
      localStorage.removeItem(DREAMSHAPER_PARAMS_STORAGE_KEY);
      localStorage.removeItem(DREAMSHAPER_PARAMS_VERSION_KEY);
      return null;
    }

    return storedParams ? JSON.parse(storedParams) : null;
  } catch (error) {
    console.error("Error retrieving parameters from localStorage:", error);
    return null;
  }
};

interface DreamshaperStore {
  loading: boolean;
  updating: boolean;
  stream: Stream | null;
  streamUrl: string | null;
  pipeline: any | null;
  sharedParamsApplied: boolean;
  sharedPrompt: string | null;
  errorState: boolean;

  setLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setStream: (stream: Stream) => void;
  setStreamUrl: (url: string) => void;
  setPipeline: (pipeline: any) => void;
  setSharedParamsApplied: (applied: boolean) => void;
  setSharedPrompt: (prompt: string | null) => void;
  setErrorState: (error: boolean) => void;
}

export const useDreamshaperStore = create<DreamshaperStore>(set => ({
  loading: true,
  updating: false,
  stream: null,
  streamUrl: null,
  pipeline: null,
  sharedParamsApplied: false,
  sharedPrompt: null,
  errorState: false,

  setLoading: loading => set({ loading }),
  setUpdating: updating => set({ updating }),
  setStream: stream => set({ stream }),
  setStreamUrl: streamUrl => set({ streamUrl }),
  setPipeline: pipeline => set({ pipeline }),
  setSharedParamsApplied: applied => set({ sharedParamsApplied: applied }),
  setSharedPrompt: prompt => set({ sharedPrompt: prompt }),
  setErrorState: error => set({ errorState: error }),
}));

export function useInputPromptHandling() {
  const searchParams = useSearchParams();
  const { stream, pipeline } = useDreamshaperStore();
  const { setLastSubmittedPrompt, setHasSubmittedPrompt } = usePromptStore();
  const [inputPromptApplied, setInputPromptApplied] = useState(false);
  const { gatewayHost, ready: gatewayHostReady } = useGatewayHost(
    stream?.id || null,
  );
  const { handleStreamUpdate } = useStreamUpdates();

  useEffect(() => {
    const applyInputPrompt = async () => {
      const inputPromptB64 = searchParams.get("inputPrompt");

      if (
        !inputPromptB64 ||
        inputPromptApplied ||
        !stream ||
        !gatewayHostReady
      ) {
        return;
      }

      try {
        const decodedPrompt = atob(inputPromptB64);

        setLastSubmittedPrompt(decodedPrompt);
        setHasSubmittedPrompt(true);

        await handleStreamUpdate(decodedPrompt, { silent: true });

        setInputPromptApplied(true);
      } catch (error) {
        console.error("Error applying input prompt:", error);
      }
    };

    applyInputPrompt();
  }, [
    searchParams,
    stream,
    inputPromptApplied,
    gatewayHostReady,
    handleStreamUpdate,
    setLastSubmittedPrompt,
    setHasSubmittedPrompt,
  ]);

  return { inputPromptApplied };
}

export function useParamsHandling() {
  const searchParams = useSearchParams();
  const {
    stream,
    pipeline,
    sharedParamsApplied,
    setSharedParamsApplied,
    setSharedPrompt,
  } = useDreamshaperStore();

  const { gatewayHost, ready: gatewayHostReady } = useGatewayHost(
    stream?.id || null,
  );

  useInputPromptHandling();
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
            storeParamsInLocalStorage(sharedParams, pipeline.version);
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
    gatewayHostReady,
    gatewayHost,
    pipeline,
  ]);

  // Local storage params handling
  useEffect(() => {
    if (
      searchParams.get("shared") ||
      !stream ||
      sharedParamsApplied ||
      !pipeline
    ) {
      return;
    }

    if (!gatewayHostReady) {
      return;
    }

    const applyStoredParams = async () => {
      const storedParams = getParamsFromLocalStorage(pipeline.version);

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
    gatewayHostReady,
    gatewayHost,
    pipeline,
  ]);
}

export function useStreamUpdates() {
  const { stream, pipeline, setUpdating } = useDreamshaperStore();
  const { incrementPromptVersion } = usePromptVersionStore();

  const handleStreamUpdate = useCallback(
    async (prompt: string, options?: { silent?: boolean }) => {
      if (!stream) {
        console.error("No stream found, aborting update");
        if (!options?.silent) {
          toast.error("No stream found");
        }
        return;
      }

      setUpdating(true);

      let toastId;
      if (!options?.silent) {
        toastId = toast.loading("Updating the stream with prompt...");
      }

      try {
        if (!stream.id || !stream.stream_key) {
          console.error("No stream Found");
          return;
        }
        const { data: streamData, error: streamError } = await getStream(
          stream.id,
        );

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

        if (
          freshPipeline?.prioritized_params &&
          Object.keys(commands).length > 0
        ) {
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

                updatedInputValues.prompt[nodeId].inputs[actualField] =
                  numValue;
              } else if (param.widget === "checkbox") {
                updatedInputValues.prompt[nodeId].inputs[actualField] =
                  value.toLowerCase() === "true" || value === "1";
              } else {
                updatedInputValues.prompt[nodeId].inputs[actualField] = value;
              }
            }
          });
        }

        storeParamsInLocalStorage(updatedInputValues, freshPipeline.version);

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
          streamKey: stream.stream_key,
        });

        if (response.status == 200 || response.status == 201) {
          if (!options?.silent) {
            toast.success("Stream updated successfully", { id: toastId });
          }
          incrementPromptVersion();
        } else {
          if (!options?.silent) {
            toast.error("Error updating stream with prompt", { id: toastId });
          }
        }
      } catch (error) {
        console.error("Error updating stream with prompt:", error);
        if (!options?.silent) {
          toast.error("Error updating stream with prompt", {
            id: toastId,
          });
        }
      } finally {
        setUpdating(false);
      }
    },
    [stream, setUpdating],
  );

  return { handleStreamUpdate };
}

export function useInitialization() {
  const { loading: capacityLoading, hasCapacity } = useCapacityCheck();
  const { user, ready } = usePrivy();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { stream, setStreamUrl, setLoading, setStream, setPipeline } =
    useDreamshaperStore();

  const pipelineId =
    searchParams.get("pipeline_id") ||
    process.env.NEXT_PUBLIC_SHOWCASE_PIPELINE_ID ||
    DEFAULT_PIPELINE_ID;

  useEffect(() => {
    // Skip initialization entirely if we don't have capacity
    if (capacityLoading) {
      return; // Wait until capacity check is complete
    }

    if (!hasCapacity) {
      setLoading(false); // Make sure to set loading to false when at capacity
      return;
    }

    if (!ready) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        const pipeline = await getPipeline(pipelineId);
        if (!isMounted) return;
        setPipeline(pipeline);

        const inputValues = createDefaultValues(pipeline);
        const processedInputValues = processInputValues(inputValues);

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

        if (stream && stream.stream_key) {
          const whipUrl = getStreamUrl(
            stream.stream_key,
            searchParams,
            stream.whip_url,
          );

          if (!stream.whip_url || stream.whip_url !== whipUrl) {
            const updatedStream = {
              ...stream,
              whip_url: whipUrl,
              name: stream.name || "",
              from_playground: false,
            };

            const { data: updatedStreamData, error: updateError } =
              await upsertStream(updatedStream, currentUserId);

            if (updateError) {
              console.error(
                "Error updating stream with WHIP URL:",
                updateError,
              );
            } else if (updatedStreamData && isMounted) {
              setStream(updatedStreamData);
              console.log("Stream state updated with new data");
            }
          }
        }
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
  }, [pathname, ready, user, searchParams, capacityLoading, hasCapacity]);

  useEffect(() => {
    if (!stream || !stream.stream_key) {
      return;
    }
    setStreamUrl(
      getStreamUrl(stream?.stream_key, searchParams, stream.whip_url),
    );
  }, [stream]);

  return { capacityLoading, hasCapacity };
}

export const useShareLink = () => {
  const { stream, pipeline } = useDreamshaperStore();
  const { user } = usePrivy();
  const { ready: gatewayHostReady } = useGatewayHost(stream?.id || null);

  const createShareLink = useCallback(async () => {
    if (!stream || !pipeline || !gatewayHostReady) {
      console.error("No stream found, cannot create share link");
      return { error: "No stream found", url: null };
    }

    try {
      const storedParams = getParamsFromLocalStorage(pipeline.version);

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
      shareUrl.searchParams.delete("inputPrompt");
      shareUrl.searchParams.delete("sourceClipId");
      shareUrl.searchParams.set("shared", data.id);

      return { error: null, url: shareUrl.toString() };
    } catch (error) {
      console.error("Error in createShareLink:", error);
      return { error: String(error), url: null };
    }
  }, [stream, user, pipeline, gatewayHostReady]);

  return { createShareLink };
};

const MAX_STREAM_TIMEOUT_MS = 300000; // 5 minutes

export const useErrorMonitor = () => {
  const { authenticated } = usePrivy();
  const { stream, setErrorState } = useDreamshaperStore();
  const { live, capacityReached } = useStreamStatus(stream?.id, false);

  const [timeoutReached, setTimeoutReached] = useState(false);
  const errorDetectedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!live) {
        setTimeoutReached(true);
      }
    }, MAX_STREAM_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [live]);

  useEffect(() => {
    if (
      (capacityReached || (timeoutReached && !live)) &&
      !errorDetectedRef.current
    ) {
      const reason = capacityReached
        ? "no_orch_available"
        : "timeout_reached_not_live";

      console.error("Capacity reached, reason:", reason, {
        capacityReached,
        timeoutReached,
        live,
      });

      track("daydream_error_overlay_shown", {
        is_authenticated: authenticated,
        reason,
        stream_id: stream?.id,
      });

      setErrorState(true);
      errorDetectedRef.current = true;
    }
  }, [
    capacityReached,
    timeoutReached,
    live,
    stream,
    authenticated,
    setErrorState,
  ]);
};

export function useDreamshaper() {
  useInitialization();
  useParamsHandling();
  useErrorMonitor();
  const { handleStreamUpdate } = useStreamUpdates();
  const { createShareLink } = useShareLink();
  const store = useDreamshaperStore();

  return {
    ...store,
    handleStreamUpdate,
    createShareLink,
  };
}
