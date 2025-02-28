import { type ReactElement, useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getPipeline } from "@/app/api/pipelines/get";
import { upsertStream } from "@/app/api/streams/upsert";
import { toast } from "sonner";
import { updateParams } from "@/app/api/streams/update-params";
import { getStream } from "@/app/api/streams/get";
import { app } from "@/lib/env";
import { createSharedParams, getSharedParams } from "@/app/api/streams/share-params";
import { useSearchParams } from "next/navigation";

const DEFAULT_PIPELINE_ID = "pip_DRQREDnSei4HQyC8"; // Staging Dreamshaper ID
const DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS =
  "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Infra Email User ID
const SHOWCASE_PIPELINE_ID =
  process.env.NEXT_PUBLIC_SHOWCASE_PIPELINE_ID || DEFAULT_PIPELINE_ID;

const DREAMSHAPER_PARAMS_STORAGE_KEY = "dreamshaper_latest_params";
const SHARED_PARAMS_DELAY_MS = 10000; // 10 seconds delay

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

export function useDreamshaper() {
  const { user } = usePrivy();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stream, setStream] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [inputValues, setInputValues] = useState<any>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);
  const [sharedParamsApplied, setSharedParamsApplied] = useState(false);

  const storeParamsInLocalStorage = useCallback((params: any) => {
    try {
      localStorage.setItem(DREAMSHAPER_PARAMS_STORAGE_KEY, JSON.stringify(params));
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
      const sharedId = searchParams.get('shared');
      
      if (sharedId && stream && !sharedParamsApplied) {
        try {          
          const { data, error } = await getSharedParams(sharedId);
          
          if (error || !data) {
            console.error("Error fetching shared parameters:", error);
            return;
          }
                    
          setTimeout(async () => {
            try {
              const { data: streamData, error: streamError } = await getStream(stream.id);
              
              if (streamError || !streamData?.gateway_host) {
                console.error("Error fetching stream for shared params:", streamError);
                return;
              }
              
              const sharedParams = data.params;
              
              const response = await updateParams({
                body: sharedParams,
                host: streamData.gateway_host as string,
                streamKey: stream.stream_key as string,
              });
              
              if (response.status == 200 || response.status == 201) {
                storeParamsInLocalStorage(sharedParams);
                setInputValues(sharedParams);
              } else {
                toast.error("Failed to apply shared params");
              }
              
              setSharedParamsApplied(true);
            } catch (error) {
              console.error("Error applying shared parameters:", error);
              toast.error("An unexpected error occurred applying shared configuration");
            }
          }, SHARED_PARAMS_DELAY_MS);
        } catch (error) {
          console.error("Error in shared parameters process:", error);
          toast.error("Failed to process shared configuration");
        }
      }
    };
    
    applySharedParams();
  }, [searchParams, stream, sharedParamsApplied, storeParamsInLocalStorage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pipeline = await getPipeline(SHOWCASE_PIPELINE_ID);
        setPipeline(pipeline);

        const inputValues = createDefaultValues(pipeline);
        const processedInputValues = processInputValues(inputValues);
        setInputValues(processedInputValues);
        const { data: stream, error } = await upsertStream(
          {
            pipeline_id: pipeline.id,
            pipeline_params: processedInputValues,
          },
          user?.id ?? DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS,
        );

        if (error) {
          toast.error(`Error creating stream for playback ${error}`);
          return;
        }
        setStream(stream);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        const { data, error } = await getStream(streamId);

        if (error) {
          console.error("Error fetching stream:", error);
          if (!options?.silent) {
            toast.error("Error updating parameters", { id: toastId });
          }
          return;
        }

        if (!data?.gateway_host) {
          console.error("No gateway host found in stream data:", data);
          if (!options?.silent) {
            toast.error("No gateway host found", { id: toastId });
          }
          return;
        }

        const updatedInputValues = { ...inputValues };

        if (updatedInputValues?.prompt?.["5"]?.inputs?.text) {
          updatedInputValues.prompt["5"].inputs.text = prompt;
        } else {
          console.error("Could not find expected prompt structure:", {
            hasPrompt: !!updatedInputValues?.prompt,
            hasNode5: !!updatedInputValues?.prompt?.["5"],
            hasInputs: !!updatedInputValues?.prompt?.["5"]?.inputs,
            hasText: !!updatedInputValues?.prompt?.["5"]?.inputs?.text,
          });
        }

        const response = await updateParams({
          body: updatedInputValues,
          host: data.gateway_host as string,
          streamKey: streamKey as string,
        });

        if (response.status == 200 || response.status == 201) {
          storeParamsInLocalStorage(updatedInputValues);
          
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
    [stream, inputValues, storeParamsInLocalStorage],
  );

  const createShareLink = useCallback(async () => {
    if (!stream) {
      console.error("No stream found, cannot create share link");
      return { error: "No stream found", url: null };
    }

    try {
      const storedParams = getParamsFromLocalStorage();
      const paramsToShare = storedParams || inputValues;
      
      if (!paramsToShare) {
        return { error: "No parameters found to share", url: null };
      }

      const { data, error } = await createSharedParams(
        paramsToShare,
        user?.id ?? DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS,
        pipeline.id
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
  }, [stream, inputValues, user, pipeline, getParamsFromLocalStorage]);

  return {
    stream,
    outputPlaybackId: stream?.output_playback_id,
    streamUrl: stream ? `${app.whipUrl}${stream.stream_key}/whip` : null,
    pipeline,
    handleUpdate,
    loading,
    fullResponse,
    updating,
    createShareLink,
  };
}
