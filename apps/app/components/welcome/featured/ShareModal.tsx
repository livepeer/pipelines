"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import track from "@/lib/track";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  createShareLink: () => Promise<{ error: string | null; url: string | null }>;
  streamId?: string | null;
  isAuthenticated: boolean;
  promptVersion?: number;
}

export function ShareModal({
  isOpen,
  onClose,
  createShareLink,
  streamId,
  isAuthenticated,
  promptVersion = 0,
}: ShareModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShareUrl(null);
  }, [promptVersion]);

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const result = await createShareLink();

      if (result.error) {
        toast.error(`Error creating share link: ${result.error}`);
      } else if (result.url) {
        setShareUrl(result.url);
        track("daydream_share_link_created", {
          is_authenticated: isAuthenticated,
          stream_id: streamId,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred while creating the share link");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl && inputRef.current) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
      track("daydream_share_link_copied", {
        is_authenticated: isAuthenticated,
        stream_id: streamId,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-auto left-[50%] -translate-x-[50%] w-[calc(100%-2rem)] bg-background border border-border rounded-xl p-5 max-w-sm shadow-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl">Share your experience</DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            Your personalization, prompt, and parameters will be shared.
            <br />
            <br />
            Anyone with this link will see the exact same experience you've
            created.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mb-2 mt-3">
          {shareUrl ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={shareUrl}
                readOnly
                className="flex-1 rounded-md border-muted-foreground/20 focus-visible:ring-offset-1 text-sm"
              />
              <Button
                size="icon"
                onClick={handleCopyLink}
                className="rounded-md hover:bg-primary/90"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCreateLink}
              disabled={isCreating}
              className="w-full rounded-md hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating link...
                </>
              ) : (
                "Create link"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
