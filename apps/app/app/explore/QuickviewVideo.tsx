import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@repo/design-system/components/ui/dialog";
import { ChevronLeft, Repeat, User2 } from "lucide-react";

interface QuickviewVideoProps {
  children: React.ReactNode;
  src: string;
  onBack?: () => void;
}

export default function QuickviewVideo({ children, src }: QuickviewVideoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="w-full h-full max-w-3xl border-none bg-transparent shadow-none overflow-y-auto py-16"
        overlayClassName="bg-white sm:bg-[rgba(255,255,255,0.98)]"
        displayCloseButton={false}
      >
        <DialogHeader className="space-y-4">
          <div className="relative w-full">
            <DialogClose asChild>
              <button className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium text-[#09090B] outline-none">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back</span>
              </button>
            </DialogClose>

            <div className="flex flex-col items-center gap-1">
              <h2 className="text-2xl font-bold text-[#232323]">
                Vincent Van Gogh
              </h2>
              <div className="flex items-center gap-[15px]">
                <span className="text-sm text-[#707070]">480p</span>
                <span className="text-sm text-[#707070]">Mar 31, 8:41 AM</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
                <User2 className="w-4 h-4 text-[#09090B]" />
              </div>
              <span className="text-xs font-medium text-[#09090B]">
                Luke Zembrzuski
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4 text-[#09090B]" />
              <span className="text-sm text-[#09090B]">123</span>
            </div>
          </div>
        </DialogHeader>
        <video src={src} autoPlay muted loop playsInline className="w-full" />
      </DialogContent>
    </Dialog>
  );
}
