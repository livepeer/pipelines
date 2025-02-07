import { Button } from "@repo/design-system/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/design-system/components/ui/dialog";
import { useRouter } from "next/navigation";

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialExpiredModal({ open, onOpenChange }: TrialExpiredModalProps) {
  const { login } = usePrivy();
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
    router.push('/explore');  // Redirect to explore page when closed
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Timed Out</DialogTitle>
          <DialogDescription className="text-center">
            Thank you for trying out Livepeer pipelines. Please create an account to continue exploring the possibilities of AI video.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 mt-4">
          <Button onClick={login} className="w-full">Sign Up</Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://discord.gg/livepeer", "_blank")}
            className="w-full"
          >
            Join the Community
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
