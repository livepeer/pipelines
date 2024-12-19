"use client"

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";
import LoggedOutComponent from "@/components/modals/logged-out";
import StreamForm from "@/components/stream/stream-form";
import { getStream } from "@/app/api/streams/get";
import { upsertStream } from "@/app/api/streams/upsert";
import { usePrivy } from "@privy-io/react-auth";
import { ExternalToast, toast } from "sonner";
import { useRouter } from "next/navigation";
import Modals from "@/components/modals";

export default function Stream({
                          searchParams,
                          params,
                        }: {
  searchParams: any;
  params: { id: string };
}){

  const streamInputId = params.id;
  const router = useRouter();
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  const [stream, setStream] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toastOptions: ExternalToast = {
    position: "top-center",
    richColors: true,
  };

  const streamFormRef = useRef<any>(null);

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
      toast.error("An unexpected error occurred while fetching the stream.", toastOptions);
    } finally {
      setIsLoading(false);
    }
  }, [streamInputId]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  useEffect(() => {
    const isVerified = localStorage.getItem('isVerified');
    if (isVerified !== 'true') {
      router.push('/password-protect');
    }
  }, [router]);

  const handleSaveStream = async () => {
    if (streamFormRef.current) {
      if (streamFormRef.current.isFormValid()) {
        const updatedStream = streamFormRef.current.getFormData();
        const toastId = toast.loading("Saving stream...", toastOptions);
        updatedStream.author = user?.id;
        updatedStream.from_playground = false;//set flag indicating this is not ephemeral stream being shown in the Try/Playground components/views
        try {
          const {data: savedStream, error} = await upsertStream(
              updatedStream,
              updatedStream.author
          );
          if (error) {
            toast.error("Failed to save stream: " + error, toastOptions);
            return;
          }
          toast.dismiss(toastId);
          toast.success("Saved stream!", toastOptions);
          setStream(savedStream);
          router.push(`/streams/my-streams`);
        } catch (error) {
          toast.error("An unexpected error occurred while saving the stream.", toastOptions);
        } finally {
          toast.dismiss(toastId);
        }
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
                      <Button onClick={handleSaveStream} className="mt-4">
                        Save
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