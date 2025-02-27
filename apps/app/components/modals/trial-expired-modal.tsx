import { Button } from "@repo/design-system/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/design-system/components/ui/dialog";

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialExpiredModal({
  open,
  onOpenChange,
}: TrialExpiredModalProps) {
  const { login } = usePrivy();

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={false}>
      <DialogContent className="trial-expired-content mx-auto left-[50%] -translate-x-[50%] w-[calc(100%-2rem)] bg-[#161616] border border-[#232323] rounded-xl p-8 max-w-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-left">
            Sign in to continue streaming
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-left">
            In order to continue streaming, please sign up or sign in.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          <img src="/images/free-trial.svg" alt="Trial expired illustration" />
        </div>
        <div className="flex gap-4 mt-8">
          <Button
            onClick={() => window.open("https://discord.com/invite/hxyNHeSzCK", "_blank")}
            size="lg"
            className="rounded-full h-12 flex-1 bg-black text-white hover:bg-black/90"
          >
            Join the Community
          </Button>
          <Button
            onClick={login}
            size="lg"
            className="rounded-full h-12 flex-1"
          >
            Sign Up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
