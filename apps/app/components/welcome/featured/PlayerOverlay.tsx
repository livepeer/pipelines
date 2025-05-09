"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { useState } from "react";
import track from "@/lib/track";
import { Loader2 } from "lucide-react";

const BackToExploreLink = ({ className = "" }: { className?: string }) => (
  <a
    href="/"
    className={`text-gray-500 font-light text-sm tracking-wide flex items-center ${className}`}
    onClick={() => track("capacity_back_to_explore_clicked")}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-1"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    Back to explore
  </a>
);

interface PlayerOverlayProps {
  onSubmit?: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: boolean;
}

export function PlayerOverlay({
  onSubmit,
  isLoading = false,
  error = false,
}: PlayerOverlayProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

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
      setFormError(
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
    window.open("https://discord.gg/DwBPjfhmUt", "_blank");
  };

  if (isLoading) {
    return (
      <div className="md:absolute fixed inset-0 z-[9999] flex items-center justify-center md:bg-transparent bg-white">
        <div className="cloud-container absolute inset-0 z-0 hidden md:block">
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

        <div className="text-center z-10 relative max-w-xs md:max-w-sm w-full px-4 md:px-8">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium">Checking capacity...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="md:absolute fixed inset-0 z-[51] flex items-center justify-center md:bg-transparent bg-white">
      <div className="cloud-container absolute inset-0 z-0 hidden md:block">
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

      <div className="max-w-xs md:max-w-sm w-full px-4 md:px-8 py-8 md:py-10 z-10 relative md:bg-transparent">
        <div
          className="absolute -inset-8 blur-lg z-0 rounded-full hidden md:block"
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
            {error ? (
              <>
                <h2 className="text-2xl font-bold mb-3">Daydream is in beta</h2>
                <p className="text-muted-foreground">
                  We&apos;re still chasing down some bugs, and it looks like you
                  found one! Try refreshing or drop your email for updates on
                  our progress.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-3">
                  Daydream is in High Demand
                </h2>
                <p className="text-muted-foreground">
                  Our community is growing fast, and we are currently at full
                  capacity. Drop your email below to stay in touch.
                </p>
              </>
            )}
          </div>
        )}

        {isSubmitted ? (
          <div className="py-6 text-center relative z-10">
            <h3 className="text-3xl font-medium mb-3">You&apos;re all set!</h3>
            <p className="text-muted-foreground mb-8">
              {error
                ? "We're hard at work improving Daydream, and we'll keep you updated on the journey."
                : "We're hard at work adding more capacity, and we'll notify you when space opens up."}
            </p>
            <div className="hidden md:flex justify-center w-full">
              <Button
                type="button"
                variant="default"
                className="rounded-md bg-black text-white hover:bg-gray-800 w-full max-w-xs"
                onClick={() => track("capacity_got_it_clicked")}
                asChild
              >
                <a href="/">Explore community creations</a>
              </Button>
            </div>
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
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-md alwaysAnimatedButton"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Submitting..."
                  : error
                    ? "Stay updated"
                    : "Notify me"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-md border-none shadow-none"
                onClick={handleCommunityClick}
              >
                Join Discord
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="md:hidden absolute bottom-8 text-center z-10 w-full px-4">
        <Button
          type="button"
          variant="default"
          className="rounded-md bg-black text-white hover:bg-gray-800 w-full"
          onClick={() => track("capacity_got_it_clicked")}
          asChild
        >
          <a href="/">Explore community creations</a>
        </Button>
      </div>
    </div>
  );
}
