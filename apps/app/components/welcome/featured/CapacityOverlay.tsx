"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { useState } from "react";
import track from "@/lib/track";
import { Loader2 } from "lucide-react";

interface CapacityOverlayProps {
  onSubmit?: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export function CapacityOverlay({
  onSubmit,
  isLoading = false,
}: CapacityOverlayProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      track("capacity_notification_requested", { email });

      const response = await fetch("/api/capacity-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSubmitted(true);

      if (onSubmit) {
        await onSubmit(email);
      }
    } catch (error) {
      console.error("Failed to submit capacity notification request:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as Error).message
          : "Failed to submit your email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommunityClick = () => {
    track("capacity_community_clicked");
    window.open("ttps://discord.com/invite/hxyNHeSzCK", "_blank");
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="cloud-container absolute inset-0 z-0">
          <div
            className="cloud-layer"
            id="cloud1"
            style={{ opacity: 0.3 }}
          ></div>
          <div
            className="cloud-layer"
            id="cloud3"
            style={{ opacity: 0.3 }}
          ></div>
          <div
            className="absolute inset-0 z-[6]"
            style={{
              background:
                "radial-gradient(circle, #fefefe 0%, rgba(254, 254, 254, 0.9) 30%, rgba(254, 254, 254, 0.7) 50%, rgba(254, 254, 254, 0.2) 70%, transparent 100%)",
              pointerEvents: "none",
            }}
          ></div>
          <div
            className="absolute inset-0 z-[6] backdrop-blur-sm"
            style={{ pointerEvents: "none" }}
          ></div>
        </div>

        <div className="text-center z-10 relative">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium">Checking capacity...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="cloud-container absolute inset-0 z-0">
        <div className="cloud-layer" id="cloud1" style={{ opacity: 0.1 }}></div>
        <div className="cloud-layer" id="cloud3" style={{ opacity: 0.2 }}></div>
        <div className="cloud-layer" id="cloud5" style={{ opacity: 0.1 }}></div>
        <div
          className="absolute inset-0 z-[6]"
          style={{
            background:
              "radial-gradient(circle, #fefefe 0%, rgba(254, 254, 254, 0.9) 30%, rgba(254, 254, 254, 0.7) 50%, rgba(254, 254, 254, 0.2) 70%, transparent 100%)",
            pointerEvents: "none",
          }}
        ></div>
        <div
          className="absolute inset-0 z-[6] backdrop-blur-sm"
          style={{ pointerEvents: "none" }}
        ></div>
        <div className="bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.1)] absolute inset-0 z-[7] opacity-[30%]"></div>
      </div>

      <div className="max-w-md w-full px-8 py-10 z-10 relative">
        <div
          className="absolute -inset-8 blur-lg z-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(254,254,254,0.6) 30%, rgba(254,254,254,0.8) 60%, rgba(254,254,254,0.2) 80%, rgba(254,254,254,0) 100%)",
            pointerEvents: "none",
          }}
        ></div>

        {!isSubmitted && (
          <div className="text-center mb-8 relative z-10">
            <div className="mb-4 relative z-10">
              <div className="p-2 rounded-full flex items-center justify-center">
                <svg
                  className="translate-x-2"
                  width="50"
                  height="50"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.305908 14.4529L0.305908 17.5L3.2968 17.5L3.2968 14.4529L0.305908 14.4529ZM0.305908 7.39808L0.305908 10.4451L3.2968 10.4451L3.2968 7.39808L0.305908 7.39808ZM13.2147 7.39808L13.2147 10.4451L16.2056 10.4451L16.2056 7.39808L13.2147 7.39808ZM0.305908 3.54706L0.305907 0.499996L3.2968 0.499996L3.2968 3.54706L0.305908 3.54706ZM6.76031 6.91402L6.76031 3.86696L9.75121 3.86696L9.75121 6.91402L6.76031 6.91402ZM6.76031 10.9258L6.76031 13.9728L9.75121 13.9728L9.75121 10.9258L6.76031 10.9258Z"
                    fill="#2E2E2E"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">Daydream is busy!</h2>
            <p className="text-muted-foreground">
              We&apos;re experiencing high demand. Join our waitlist to be
              notified when capacity is available.
            </p>
          </div>
        )}

        {isSubmitted ? (
          <div className="py-6 text-center relative z-10">
            <h3 className="text-xl font-medium mb-2">Thank you!</h3>
            <p className="text-muted-foreground">
              We&apos;ll notify you once Daydream has available capacity.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Your e-mail address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="rounded-md bg-white"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Notify me"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-md border-none shadow-none"
                onClick={handleCommunityClick}
              >
                Join Community
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
