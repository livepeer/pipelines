"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";
import LoggedOutComponent from "@/components/modals/logged-out";
import StreamForm from "@/components/stream/stream-form";
import { getStream } from "@/app/api/streams/get";
import { ExternalToast, toast } from "sonner";
import { useRouter } from "next/navigation";
import Modals from "@/components/modals";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";

export default function Stream({
  searchParams,
  params,
}: {
  searchParams: any;
  params: { id: string };
}) {
  const streamInputId = params.id;
  const router = useRouter();
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  const [stream, setStream] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const streamFormRef = useRef<any>(null);

  const toastOptions: ExternalToast = {
    position: "top-center",
    richColors: true,
  };

  const fetchStream = useCallback(async () => {
    if (!streamInputId || streamInputId === "create") {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: fetchedStream, error } = await getStream(streamInputId);
      if (error) {
        toast.error("Failed to fetch stream: " + error, toastOptions);
        return;
      }
      setStream(fetchedStream);
    } catch (error) {
      toast.error(
        "An unexpected error occurred while fetching the stream.",
        toastOptions,
      );
    } finally {
      setIsLoading(false);
    }
  }, [streamInputId]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  useEffect(() => {
    // Track when stream page is viewed
    track("create_stream_page_viewed", {
      stream_id: streamInputId,
      is_new: streamInputId === "create",
    });
  }, [streamInputId]);

  const handleSaveStream = async () => {
    if (streamFormRef.current) {
      if (isSubmitting) return;
      setIsSubmitting(true);

      if (streamFormRef.current?.isFormValid()) {
        const updatedStream = streamFormRef.current.getFormData();

        // Track attempt to save
        track("create_stream_save_attempted", {
          stream_id: updatedStream.id,
        });

        const toastId = toast.loading("Saving stream...", toastOptions);

        updatedStream.author = user?.id;
        updatedStream.from_playground = false; //set flag indicating this is not ephemeral stream being shown in the Try/Playground components/views

        try {
          let savedStream, error;

          if (streamInputId === "create") {
            // Create new stream
            // Build URL with search params for WHIP URL generation
            const apiUrl = new URL("/api/streams", window.location.origin);
            // Forward relevant search params to the API
            const searchParams = new URLSearchParams(window.location.search);
            const relevantParams = ["whipServer", "orchestrator"];
            relevantParams.forEach(param => {
              const value = searchParams.get(param);
              if (value) {
                apiUrl.searchParams.set(param, value);
              }
            });

            const result = await fetch(apiUrl.toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": user?.id || "",
              },
              body: JSON.stringify({
                pipeline_id: updatedStream.pipeline_id,
                pipeline_params: updatedStream.pipeline_params,
                name: updatedStream.name,
                from_playground: false,
                is_smoke_test: false,
              }),
            });

            const resultData = await result.json();
            if (result.ok) {
              savedStream = resultData.data;
              error = null;
            } else {
              error = resultData.error;
            }
          } else {
            // Update existing stream using PATCH API
            const response = await fetch(`/api/streams/${streamInputId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": user?.id || "",
              },
              body: JSON.stringify({
                name: updatedStream.name,
                pipeline_params: updatedStream.pipeline_params,
              }),
            });

            const result = await response.json();
            if (response.ok) {
              savedStream = result.data;
              error = null;
            } else {
              error = result.error;
            }
          }

          if (error) {
            console.error("Save error:", error);
            toast.error("Failed to save stream: " + error, toastOptions);
            track("create_stream_save_failed", {
              stream_id: updatedStream.id,
              error: error,
            });
            return;
          }

          toast.dismiss(toastId);
          toast.success("Saved stream!", toastOptions);
          setStream(savedStream);
          track("create_stream_save_success", {
            stream_id: savedStream.id,
            pipeline_id: savedStream.pipeline_id,
          });
          router.push(`/streams/my-streams`);
        } catch (error) {
          track("create_stream_save_failed", {
            stream_id: updatedStream.id,
            error: error,
          });
          console.error("Unexpected save error:", error);
          toast.error(
            "An unexpected error occurred while saving the stream.",
            toastOptions,
          );
        } finally {
          setIsSubmitting(false);
          toast.dismiss(toastId);
        }
      } else {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="p-4">
      {!isAuthLoaded || isLoading ? (
        <LoaderCircleIcon className="w-8 h-8 animate-spin" />
      ) : stream || streamInputId === "create" ? (
        <>
          <h4 className="text-lg mb-4 font-medium">
            {!stream ? "Create" : "Edit"} Stream
          </h4>
          {authenticated ? (
            <>
              <StreamForm stream={stream} ref={streamFormRef} />
              <div className="pt-4">
                <Button
                  onClick={handleSaveStream}
                  className="mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      Saving{" "}
                      <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <LoggedOutComponent text="Sign in to create or edit a stream" />
          )}
        </>
      ) : (
        <div>
          Error loading stream. <Button onClick={fetchStream}>Retry</Button>
        </div>
      )}
      <Modals searchParams={searchParams} />
    </div>
  );
}
