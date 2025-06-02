"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGuestUserStore } from "@/hooks/useGuestUser";
import track from "@/lib/track";

interface GuestSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "prompt_limit" | "record_clip" | "share" | null;
}

export function GuestSignupModal({
  isOpen,
  onClose,
  reason,
}: GuestSignupModalProps) {
  const router = useRouter();
  const { setIsGuestUser } = useGuestUserStore();
  const { lastPrompt } = useGuestUserStore();

  const getTitle = () => {
    switch (reason) {
      case "prompt_limit":
        return "Enjoying Daydream?";
      case "record_clip":
        return "Ready to save your creation?";
      case "share":
        return "Ready to share your creation?";
      default:
        return "Join Daydream";
    }
  };

  const getMessage = () => {
    switch (reason) {
      case "prompt_limit":
        return "Sign up to continue creating with unlimited prompts!";
      case "record_clip":
        return "Sign up to save your creation as a clip!";
      case "share":
        return "Sign up to share your creation with others!";
      default:
        return "Sign up to unlock all features!";
    }
  };

  const handleSignUp = () => {
    track("guest_user_sign_up_clicked", {
      reason,
      last_prompt: lastPrompt,
    });

    localStorage.setItem("daydream_from_guest_experience", "true");

    setIsGuestUser(false);

    onClose();
    router.push("/create");
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader className="flex flex-col items-center gap-1">
          <DialogTitle className="text-2xl font-semibold">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 mt-4">
          <Button
            onClick={handleSignUp}
            className="alwaysAnimatedButton py-6 w-full text-base font-semibold text-black"
          >
            Join Daydream
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-sm text-gray-500"
          >
            Continue as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
