import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PromptForm } from "../home/PromptForm";
import { PromptDisplay } from "../home/PromptDisplay";
import { PromptItem } from "@/app/api/prompts/types";
import { useAppConfig } from "@/hooks/useAppConfig";
import { getStream } from "@/app/api/streams/get";
import { updateParams } from "@/app/api/streams/update-params";
import { toast } from "sonner";

interface MobilePromptPanelProps {
  streamId: string;
}

export function MobilePromptPanel({ streamId }: MobilePromptPanelProps) {
  const [promptQueue, setPromptQueue] = useState<PromptItem[]>([]);
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);
  const [promptAvatarSeeds, setPromptAvatarSeeds] = useState<string[]>([]);
  const [userPromptIndices, setUserPromptIndices] = useState<boolean[]>([]);
  const [promptValue, setPromptValue] = useState("");
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);
  const [streamData, setStreamData] = useState<any>(null);
  const appConfig = useAppConfig();

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        const { data, error } = await getStream(streamId);
        if (error) {
          toast.error("Failed to fetch stream data");
          return;
        }
        setStreamData(data);
      } catch (error) {
        toast.error("Error connecting to stream");
      }
    };

    if (streamId) {
      fetchStreamData();
    }
  }, [streamId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!streamData?.gateway_host || !promptValue.trim()) return;

    try {
      const response = await updateParams({
        body: { prompt: promptValue },
        host: streamData.gateway_host,
        streamKey: streamData.stream_key,
      });

      if (response.status === 200 || response.status === 201) {
        // Add to prompt queue
        const newPrompt: PromptItem = {
          text: promptValue,
          seed: Math.random().toString(),
          isUser: true,
          timestamp: Date.now(),
          streamKey: streamData.stream_key
        };
        setPromptQueue(prev => [...prev, newPrompt]);
        setDisplayedPrompts(prev => [...prev, promptValue]);
        setPromptAvatarSeeds(prev => [...prev, Math.random().toString()]);
        setUserPromptIndices(prev => [...prev, true]);
        setPromptValue("");
        toast.success("Prompt sent successfully");
      } else {
        toast.error("Failed to send prompt");
      }
    } catch (error) {
      toast.error("Error sending prompt");
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(e.target.value);
  };

  const handlePastPromptClick = (prompt: string) => {
    setPromptValue(prompt);
  };

  if (!streamData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading stream data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFB]">
      <div className="flex-1 overflow-hidden relative">
        <div
          className="absolute top-0 left-0 right-0 h-[60%] pointer-events-none z-30"
          style={{
            background:
              "linear-gradient(rgb(251, 251, 251) 0%, rgba(251, 251, 251, 0.7) 3%, rgba(251, 251, 251, 0.5) 5%, rgba(251, 251, 251, 0.3) 38%, transparent 80%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
          style={{
            background:
              "linear-gradient(to bottom, rgba(206, 223, 228, 0.6) 0%, rgba(206, 223, 228, 0.5) 40%, rgba(206, 223, 228, 0.4) 60%, rgba(206, 223, 228, 0.2) 80%, rgba(254, 254, 254, 0.05) 90%, rgba(254, 254, 254, 0) 100%)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none z-20"
          style={{
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.05) 90%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="flex justify-between items-center gap-2 h-12 px-6 py-3 z-[999]">
          <p className="text-sm font-bold">Live Prompting</p>
          <p className="text-xs font-light">
            {promptQueue.length === 0
              ? "No prompts in queue"
              : `${promptQueue.length} prompt${promptQueue.length === 1 ? "" : "s"} in queue`}
          </p>
        </div>
        <PromptDisplay
          promptQueue={promptQueue}
          displayedPrompts={displayedPrompts}
          promptAvatarSeeds={promptAvatarSeeds}
          userPromptIndices={userPromptIndices}
          onPastPromptClick={handlePastPromptClick}
          isMobile={true}
        />
      </div>

      <PromptForm
        onSubmit={handleSubmit}
        value={promptValue}
        onChange={handlePromptChange}
        isThrottled={isThrottled}
        throttleTimeLeft={throttleTimeLeft}
        isMobile={true}
      />
    </div>
  );
}
