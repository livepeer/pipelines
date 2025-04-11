import { cn } from "@repo/design-system/lib/utils";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center mt-6", className)}>
      <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
    </div>
  );
}
