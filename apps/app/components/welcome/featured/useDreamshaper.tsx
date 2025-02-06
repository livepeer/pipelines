import { type ReactElement, useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getPipeline } from "@/app/api/pipelines/get";
import { upsertStream } from "@/app/api/streams/upsert";
import { toast } from "sonner";
import { updateParams } from "@/app/api/streams/update-params";
import { getStream } from "@/app/api/streams/get";
import { app } from "@/lib/env";

const DEFAULT_PIPELINE_ID = "pip_DRQREDnSei4HQyC8"; // Staging Dreamshaper ID
const DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS =
  "did:privy:cm4x2cuiw007lh8fcj34919fu"; // Infra Email User ID
const SHOWCASE_PIPELINE_ID =
  process.env.NEXT_PUBLIC_SHOWCASE_PIPELINE_ID || DEFAULT_PIPELINE_ID;

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
    })
  );
};

export function useDreamshaper() {
  const { user } = usePrivy();

  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [inputValues, setInputValues] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the pipeline from DB
        const pipeline = await getPipeline(SHOWCASE_PIPELINE_ID);
        setPipeline(pipeline);

        // Create a stream with pipeline inputs
        const inputValues = createDefaultValues(pipeline);
        const processedInputValues = processInputValues(inputValues);
        setInputValues(processedInputValues);
        const { data: stream, error } = await upsertStream(
          {
            pipeline_id: pipeline.id,
            pipeline_params: processedInputValues,
          },
          user?.id ?? DUMMY_USER_ID_FOR_NON_AUTHENTICATED_USERS
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
    async (prompt: string) => {
      if (!stream) {
        toast.error("No stream found");
        return;
      }

      const streamId = stream.id;
      const streamKey = stream.stream_key;
      toast.loading("Updating the stream with prompt...");
      const { data, error } = await getStream(streamId);

      if (error) {
        toast.error("Error updating parameters");
        return;
      }

      if (!data?.gateway_host) {
        toast("No gateway host found");
        return;
      }

      // Update the prompt in the input values
      const updatedInputValues = { ...inputValues };
      if (updatedInputValues?.prompt?.["5"]?.inputs?.text) {
        updatedInputValues.prompt["5"].inputs.text = prompt;
      }

      const response = await updateParams({
        body: updatedInputValues,
        host: data.gateway_host as string,
        streamKey: streamKey as string,
      });

      if (response.status == 200 || response.status == 201) {
        toast.success("Stream updated successfully");
      } else {
        toast.error("Error updating stream with prompt");
      }
    },
    [stream]
  );

  return {
    stream,
    outputPlaybackId: stream?.output_playback_id,
    streamUrl: stream ? `${app.whipUrl}${stream.stream_key}/whip` : null,
    pipeline,
    handleUpdate,
    loading,
  };
}
