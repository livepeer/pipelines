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

const App = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): ReactElement => {
  const [showInterstitial, setShowInterstitial] = useState(true);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [ingestUrl, setIngestUrl] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateEnv();
    validateServerEnv();
    
    const hasSeenInterstitial = localStorage.getItem("hasSeenInterstitial");
    if (hasSeenInterstitial) {
      setShowInterstitial(false);
    }
    setHasCheckedStorage(true);
  }, []);

  const initializeStream = async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      // Create a new stream
      const response = await fetch('/api/streams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Video Style Transfer Stream',
          pipelineId: isProduction() ? 'pip_CXJea3LCcTatYQYK' : 'pip_nWWnMM3zHMudcMuz'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create stream');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setIngestUrl(data.ingestUrl);
      setPlaybackId(data.playbackId);
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
          pipelineId: isProduction() ? 'pip_CXJea3LCcTatYQYK' : 'pip_nWWnMM3zHMudcMuz',
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
        <div className="flex-grow flex gap-4 min-h-0">
          {/* Video container wrapper */}
          <div className="flex flex-1 gap-4">
            {/* Left side - Webcam feed */}
            <div className="flex-1 bg-sidebar rounded-lg overflow-hidden">
              <div className="w-full h-full">
                {isInitializing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <BroadcastWithControls ingestUrl={ingestUrl} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Transformed output */}
            <div className="flex-1 bg-sidebar rounded-lg overflow-hidden">
              <div className="w-full h-full">
                {isInitializing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : playbackId ? (
                  <div className="w-full h-full">
                    <LPPLayer output_playback_id={playbackId} />
                  </div>
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
