"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Button } from "@repo/design-system/components/ui/button";
import { BroadcastWithControls } from "@/components/playground/broadcast";
import { LPPLayer } from "@/components/playground/player";
import { validateEnv, isProduction } from "@/lib/env";
import { validateServerEnv } from "@/lib/serverEnv";
import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import Interstitial from "@/components/welcome/interstitial";
import Modals from "@/components/modals";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { upsertStream } from "@/app/api/streams/upsert";
import { usePrivy } from "@privy-io/react-auth";
import track from "@/lib/track";

const App = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): ReactElement => {
  const { user } = usePrivy();
  const [showInterstitial, setShowInterstitial] = useState(true);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [ingestUrl, setIngestUrl] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineId, setPipelineId] = useState<string>('pip_nWWnMM3zHMudcMuz'); // Default to development pipeline


  useEffect(() => {
    const initialize = async () => {
      validateEnv();
      validateServerEnv();
      
      // Set the correct pipeline ID based on environment
      setPipelineId(isProduction() ? 'pip_CXJea3LCcTatYQYK' : 'pip_nWWnMM3zHMudcMuz');
      
      const hasSeenInterstitial = localStorage.getItem("hasSeenInterstitial");
      if (hasSeenInterstitial) {
        setShowInterstitial(false);
        // Ensure state updates are processed before initializing stream
        await Promise.resolve();
        await initializeStream();
      }
      setHasCheckedStorage(true);
    };

    initialize();
  }, []);

  const initializeStream = async () => {
    if (isInitializing) return;
    
    console.log('Initializing stream with pipeline:', pipelineId);
    setIsInitializing(true);
    try {
      // Create properly structured pipeline parameters
      const streamData = {
        pipeline_id: pipelineId,
        pipeline_params: {
          prompt: {
            "3": {
              "inputs": {
                "text": prompt || "A cinematic movie scene",
                "clip": ["CLIPTextEncode", "CLIPTextEncode"]
              },
              "class_type": "CLIPTextEncode"
            }
          }
        }
      };

      console.log('Sending stream data:', streamData);
      
      const { data: stream, error } = await upsertStream(
        streamData,
        user?.id ?? "did:privy:cm32cnatf00nrx5pee2mpl42n"
      );

      if (error) {
        console.error('Stream creation error:', error);
        toast.error(`Error creating stream for playback ${error}`);
        return;
      }

      console.log('Stream data:', stream);
      const ingestUrlFull = `${stream.gateway_host}${stream.stream_key}/whip`;
      console.log('Setting ingest URL:', ingestUrlFull);
      setIngestUrl(ingestUrlFull);
      setPlaybackId(stream.playback_id);
    } catch (error) {
      console.error('Failed to initialize stream:', error);
      toast.error('Failed to initialize camera stream. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCameraPermissionGranted = () => {
    // Start initializing the stream in the background
    initializeStream();
  };

  const handleReady = () => {
    localStorage.setItem("hasSeenInterstitial", "true");
    setShowInterstitial(false);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenInterstitial", "true");
    setShowInterstitial(false);
    // Initialize stream when user skips the interstitial
    initializeStream();
  };

  const handleClickTrack = (label: string) => {
    track(
      label.toLowerCase() + "_button_clicked",
      {
        location: "demo",
      },
      user || undefined
    );
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/streams/update-params', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipelineId: pipelineId,
          params: {
            prompt: prompt.trim()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stream');
      }

      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Failed to update stream:', error);
      toast.error('Failed to update prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a loading div while checking localStorage
  if (!hasCheckedStorage) {
    return <div className="h-screen" />;
  }

  const samplePrompts:string[] = ['A big-budget Hollywood superhero movie...', 'Studio Ghibli fantastical creatures...', 'Grainy black-and-white western...']

  return (
    <>
      {showInterstitial && (
        <Interstitial 
          onReady={handleReady} 
          onSkip={handleSkip} 
          setShowInterstitial={setShowInterstitial}
          onCameraPermissionGranted={handleCameraPermissionGranted}
        />
      )}
      <div className="flex flex-col h-screen p-4 gap-4">
        {/* Header section */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold">Livepeer Pipelines</h1>
          <p className="text-muted-foreground">Transform your video in real-time with AI - and build your own workflow with ComfyUI</p>

        </div>

        {/* Top section with prompt input */}
        <div className="flex-shrink-0 flex">
          <div className="relative w-[calc(90%-0.5rem)]">
            <Input 
              placeholder={samplePrompts[Math.floor(Math.random() * samplePrompts.length)]}
              className="w-full pr-[140px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Apply (⌘ + Enter)
            </Button>
          </div>
          <Button
          variant="outline"
          className="hidden md:flex right-0"
          onClick={() => {
            window.open("https://pipelines.livepeer.org/docs/technical/develop-pipeline/create-your-first-pipeline", "_blank");
            handleClickTrack("build-your-own");
          }}
        >
           <span>Build your own pipeline 🔗</span>
        </Button>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 min-h-0">
          {/* Video container wrapper */}
          <div className="relative w-full h-full">
            {/* Full width playback */}
            <div className="w-full h-full">
              {isInitializing ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : playbackId ? (
                <LPPLayer output_playback_id={playbackId} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Waiting for stream to start...
                </div>
              )}
            </div>
            
            {/* Picture-in-Picture broadcast */}
            <div className="absolute bottom-6 right-4 w-1/2 md:w-1/5 bg-sidebar overflow-hidden rounded-lg shadow-lg">
              {isInitializing ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <BroadcastWithControls ingestUrl={ingestUrl} />
              )}
            </div>
          </div>
        </div>
        <Modals searchParams={searchParams} />
      </div>
    </>
  );
};

export default App;
