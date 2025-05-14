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
import { DiscordLogoIcon } from "@radix-ui/react-icons";
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
    window.open("https://discord.gg/5sZu8xmn6U", "_blank");
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-lg">
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
                <span className="text-xl font-bold">
                  Daydream is in High Demand
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-medium">
                  You&apos;re all set!
                </span>
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
          <div className="py-6 text-center flex flex-col h-full justify-between">
            <p className="text-muted-foreground">
              We&apos;re hard at work adding more capacity, and we&apos;ll
              notify you when space opens up.
            </p>
            <div className="mt-auto pt-8">
              <Button
                type="button"
                variant="default"
                className="w-full rounded-md bg-black text-white hover:bg-gray-800"
                onClick={() => {
                  track("capacity_notification_closed");
                  onClose();
                }}
              >
                Explore community creations
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm text-center mb-3">
              Our community is growing fast, and we are currently at full
              capacity. Drop your email below to stay in touch.
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
                  variant="default"
                  className="w-full rounded-md bg-black text-white hover:bg-gray-800"
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
                  Join Discord
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
