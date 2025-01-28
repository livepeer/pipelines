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
      const { data: stream, error } = await upsertStream(
        {
          pipeline_id: pipelineId,
          pipeline_params: {
            prompt: prompt || "A cinematic movie scene"
          }
        },
        user?.id ?? "did:privy:cm32cnatf00nrx5pee2mpl42n" // Dummy user id for non-authenticated users
      );

      if (error) {
        toast.error(`Error creating stream for playback ${error}`);
        return;
      }

      console.log('Stream data:', stream);
      setIngestUrl(`${stream.gateway_host}${stream.stream_key}/whip`);
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
        <div className="flex-shrink-0 flex gap-2">
          <Input 
            placeholder={samplePrompts[Math.floor(Math.random() * samplePrompts.length)]}
            className="flex-grow"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Submit
          </Button>
        </div>
        
        {/* Main content area with split view */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Video container wrapper */}
          <div className="flex flex-1 gap-4">
            {/* Left side - Webcam feed */}
            <div className="flex-1 bg-sidebar overflow-hidden">
              <div className="aspect-video">
                {isInitializing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <BroadcastWithControls ingestUrl={ingestUrl} />
                )}
              </div>
            </div>
            
            {/* Right side - Transformed output */}
            <div className="flex-1 bg-sidebar overflow-hidden">
              <div className="aspect-video">
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
            </div>
          </div>
        </div>
        <Modals searchParams={searchParams} />
      </div>
    </>
  );
};

export default App;
