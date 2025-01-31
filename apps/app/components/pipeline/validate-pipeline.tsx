"use client";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { Separator } from "@repo/design-system/components/ui/separator";
import { AlertCircle, CircleDot, LoaderCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";

function usePipelineStatus(streamId: string) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let source: EventSource;
    const fetchSseMessages = async () => {
      source = new EventSource(`/api/streams/${streamId}/sse`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setData(data);
      };
      source.onerror = (error) => {
        console.error("Error fetching pipeline status:", error);
        source.close();
      };
      setTimeout(() => {
        if (source) {
          source.close();
        }
        setIsLoading(false);
      }, 60000);
    };
    fetchSseMessages();

    return () => {
      if (source) {
        source.close();
      }
    };
  }, []);

  return { data, isLoading };
}

function getPipelineStatus(data: any) {
  const state = (data?.state || 'initiated').toLowerCase();
  const inputFps = data?.input_status?.fps?.toFixed(2) ?? 0;
  const outputFps = data?.inference_status?.fps?.toFixed(2) ?? 0;
  const error = data?.inference_status?.last_error;
  const degradation = inputFps > 0 ? ((inputFps - outputFps) / inputFps) * 100 : 0;
  
  let status = state;
  switch (state) {
    case 'initiated':
      status = 'initiated';
      break;
    case 'online':
      status = 'online';
      break;
    default:
      status = 'processing';
      break;
  }
  
  return {
    status,
    inputFps,
    outputFps,
    degradation,
    error,
  }
}

export default function ValidatePipeline({ streamId }: { streamId: string }) {
  const { data, isLoading } = usePipelineStatus(streamId);
  const { status, degradation, outputFps } = getPipelineStatus(data);
  return (
    <main className="flex-1 p-4">
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-medium text-foreground text-lg">Validate Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure and publish your streaming pipeline</p>
      </div>

      <Card className="mb-6 border-border">
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <CircleDot className="w-4 h-4" />
            Step 2
          </div>
          <CardTitle className="flex gap-4 items-center text-xl text-foreground">
            <span>Review pre-deployment test results</span> 
            {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {
              isLoading ? (
               ` We are running your pipeline to benchmark its performance. This may take upto 90 seconds`
              ) : (
                  `We ran your pipeline for 90 seconds to benchmark its performance.`
              )
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Framerate Section */}
          <div>
            <h3 className="font-medium mb-3 text-foreground">Average Framerate</h3>
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50">
              <Zap className="w-5 h-5 dark:text-amber-400 text-amber-500" />
              <span className="dark:text-amber-200 text-amber-700">
                15.3 FPS{" "}
                <span className="dark:text-amber-400 text-amber-600">
                  (we recommend further optimization, but you can publish this)
                </span>
              </span>
            </div>
          </div>

          {/* Degradation Section */}
          <div>
            <h3 className="font-medium mb-3 text-foreground">Framerate Degradation</h3>
            <div className="flex items-center gap-2 p-4 dark:bg-emerald-950/50 bg-emerald-50 border border-emerald-800/50">
              <CircleDot className="w-5 h-5 dark:text-emerald-400 text-emerald-500" />
              <span className="dark:text-emerald-200 text-emerald-700">3% - looks good</span>
            </div>
          </div>

          {/* Parameter Control - Error State */}
          <div>
            <h3 className="font-medium mb-3 text-foreground">Parameter Control</h3>
            <div className="flex items-center gap-2 p-4 dark:bg-red-950/50 bg-red-50 border border-red-800/50">
              <AlertCircle className="w-5 h-5 dark:text-red-400 text-red-500" />
              <span className="dark:text-red-200 text-red-700">Failed: Unable to change priority parameters</span>
            </div>
          </div>
        </CardContent>
        <Separator className="bg-border" />
        <CardFooter className="pt-6">
          <Button size="lg" className="w-full">
            Publish Pipeline
          </Button>
        </CardFooter>
      </Card>
    </div>
  </main>
  );
}
