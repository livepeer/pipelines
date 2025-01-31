"use client";
import { publishPipeline } from "@/app/api/pipelines/edit";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Separator } from "@repo/design-system/components/ui/separator";
import { AlertCircle, CircleDot, Info, LoaderCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TIMEOUT_MS = 90000;

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
      }, TIMEOUT_MS);
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

function validateFps(fps: number) {
  if (fps < 5) {
    return {
      variant: "error",
      text: `${fps} FPS - further optimization required (cannot be published)`,
    };
  }
  if (fps < 20) {
    return {
      variant: "warning",
      text: `${fps} FPS - recommended further optimization`,
    };
  }

  return {
    variant: "success",
    text: `${fps} FPS`,
  };
}

function validateDegradation(degradation: number) {
  if (degradation > 30) {
    return {
      variant: "error",
      text: `${degradation.toFixed(2)}% - further optimization required (cannot be published)`,
    };
  }
  if (degradation > 10) {
    return {
      variant: "warning",
      text: `${degradation.toFixed(2)}% - recommended further optimization`,
    };
  }

  return {
    variant: "success",
    text: `${degradation.toFixed(2)}%`,
  };
}

function getPipelineStatus(data: any) {
  const state = (data?.state || "initiated").toLowerCase();
  const inputFps = data?.input_status?.fps?.toFixed(2) ?? 0;
  const outputFps = data?.inference_status?.fps?.toFixed(2) ?? 0;
  const error = data?.inference_status?.last_error;
  const degradation =
    inputFps > 0 ? ((inputFps - outputFps) / inputFps) * 100 : 0;

  switch (state) {
    case "initiated":
      return {
        status: {
          variant: "info",
          text: "Initiated",
          icon: <Info />,
        },
        outputFps: {
          variant: "info",
          text: "Initiated",
          icon: <Info />,
        },

        degradation: {
          variant: "info",
          text: "Initiated",
          icon: <Info />,
        },
        error: error
          ? {
              variant: "error",
              text: error,
              icon: <AlertCircle />,
            }
          : null,
      };
    case "online":
      return {
        status: {
          variant: "success",
          text: "Online",
          icon: <CircleDot />,
        },
        outputFps: {
          ...validateFps(outputFps),
          icon: <Zap />,
        },

        degradation: {
          ...validateDegradation(degradation),
          icon: <CircleDot />,
        },
        error: error
          ? {
              variant: "error",
              text: error,
              icon: <AlertCircle />,
            }
          : null,
      };
    default:
      return {
        status: {
          variant: "warning",
          text: "Processing",
          icon: <CircleDot />,
        },
        outputFps: {
          ...validateFps(outputFps),
          icon: <CircleDot />,
        },

        degradation: {
          ...validateDegradation(degradation),
          icon: <CircleDot />,
        },
        error: error
          ? {
              variant: "error",
              text: error,
              icon: <AlertCircle />,
            }
          : null,
      };
  }
}

type StatusVariant = "success" | "warning" | "error" | "info";

function StatusTile({
  text,
  icon,
  variant,
}: {
  text: string;
  icon: React.ReactNode;
  variant: StatusVariant;
}) {
  const variantColorWrapper = {
    wrapper: {
      success:
        "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50",
      warning:
        "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50",
      error:
        "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50",
      info: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50",
    },
    icon: {
      success: "text-emerald-500 dark:text-emerald-400",
      warning: "text-amber-500 dark:text-amber-400",
      error: "text-red-500 dark:text-red-400",
      info: "text-blue-500 dark:text-blue-400",
    },
    text: {
      success: "text-emerald-700 dark:text-emerald-200",
      warning: "text-amber-700 dark:text-amber-200",
      error: "text-red-700 dark:text-red-200",
      info: "text-blue-700 dark:text-blue-200",
    },
  };

  return (
    <div
      className={`flex items-center gap-2 p-4 ${variantColorWrapper.wrapper[variant]}`}
    >
      <span className={`${variantColorWrapper.icon[variant]}`}>{icon}</span>
      <span className={`${variantColorWrapper.text[variant]}`}>{text}</span>
    </div>
  );
}

export default function ValidatePipeline({
  pipelineId,
  streamId,
}: {
  pipelineId: string;
  streamId: string;
}) {
  const router = useRouter();
  const { authenticated, user, ready: isAuthLoaded } = usePrivy();
  const { data, isLoading } = usePipelineStatus(streamId);
  const { status, degradation, outputFps, error } = getPipelineStatus(data);
  const isPublishable =
    degradation.variant !== "error" && outputFps.variant !== "error" && !error;

  return (
    <main className="flex-1 p-4">
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="font-medium text-foreground text-lg">
            Validate Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and publish your streaming pipeline
          </p>
        </div>

        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="flex gap-4 items-center text-xl text-foreground">
              <span>Review pre-deployment test results</span>
              {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isLoading
                ? ` We are running your pipeline to benchmark its performance. This may take upto 90 seconds`
                : `We ran your pipeline for 90 seconds to benchmark its performance.`}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Framerate Section */}
            <div>
              <h3 className="font-medium mb-3 text-foreground">
                Average Framerate
              </h3>
              <StatusTile
                text={outputFps.text}
                icon={outputFps.icon}
                variant={outputFps.variant as StatusVariant}
              />
            </div>

            {/* Degradation Section */}
            <div>
              <h3 className="font-medium mb-3 text-foreground">
                Framerate Degradation
              </h3>
              <StatusTile
                text={degradation.text}
                icon={degradation.icon}
                variant={degradation.variant as StatusVariant}
              />
            </div>

            {/* Parameter Control - Error State */}
            <div>
              <h3 className="font-medium mb-3 text-foreground">Status</h3>
              <StatusTile
                text={status.text}
                icon={status.icon}
                variant={status.variant as StatusVariant}
              />
            </div>

            {/* Error Section */}
            {error && (
              <div>
                <h3 className="font-medium mb-3 text-foreground">Error</h3>
                <StatusTile
                  text={error.text}
                  icon={error.icon}
                  variant={error.variant as StatusVariant}
                />
              </div>
            )}
          </CardContent>
          <Separator className="bg-border" />
          <CardFooter className="pt-6">
            {isLoading || isPublishable ? (
              <Button
                size="lg"
                className="w-full"
                disabled={isLoading || !isPublishable}
                onClick={async () => {
                  const toastId = toast.loading("Publishing pipeline...");
                  try {
                    if (!user?.id) {
                      throw new Error("User not found");
                    }
                    const pipeline = await publishPipeline(
                      pipelineId,
                      user?.id
                    );
                    toast.success("Pipeline published successfully", {
                      id: toastId,
                    });
                  } catch (error) {
                    toast.error(`Failed to publish pipeline: ${error}`, {
                      id: toastId,
                    });
                  }
                }}
              >
                Publish Pipeline
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  router.push(`/pipelines/${pipelineId}`);
                }}
              >
                Edit Pipeline
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
