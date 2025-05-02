"use client";

import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Loader2 } from "lucide-react";
import track from "@/lib/track";

interface CapacityNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CapacityNotificationModal({
  isOpen,
  onClose,
}: CapacityNotificationModalProps) {
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
    window.open("https://discord.com/invite/hxyNHeSzCK", "_blank");
  };

  const handleModalClose = () => {
    // Reset the form if closed
    if (!isSubmitted) {
      setEmail("");
      setError(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center mb-2">
            <div className="mb-4 flex justify-center">
              <div className="p-2 rounded-full">
                <svg
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
            {!isSubmitted ? (
              <>
                <span className="text-xl font-bold">Daydream is busy!</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-medium">Thank you!</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p className="text-center">Submitting your email...</p>
          </div>
        ) : isSubmitted ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-6">
              We&apos;ll notify you once Daydream has available capacity.
            </p>
            <a
              href="/"
              className="text-gray-500 font-light text-sm tracking-wide flex items-center justify-center"
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
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-center mb-6">
              We&apos;re experiencing high demand. Join our waitlist to be
              notified when capacity is available.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  variant="outline"
                  className="w-full rounded-md alwaysAnimatedButton"
                  disabled={isSubmitting}
                >
                  Notify me
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
