import { Logo } from "@/components/sidebar";

interface OverlayProps {
  statusMessage: string;
}

export default function Overlay({ statusMessage }: OverlayProps) {
  return (
    <>
      <div className="absolute inset-0 rounded-2xl loading-gradient z-10"></div>
      <div className="absolute inset-0 rounded-2xl backdrop-blur-[125px] z-20"></div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-20">
        <Logo className="w-8 h-8 sm:w-10 sm:h-10 mb-6" />
        <div className="flex flex-col items-center gap-6 justify-center max-w-80 text-foreground sm:mb-6">
          <p className="shimmer-text shimmer-slow text-lg sm:text-xl font-semibold">
            {statusMessage ? (
              statusMessage
            ) : (
              <span>
                Welcome to <span className="font-medium"> Daydream</span>
              </span>
            )}
          </p>
          <p className="text-foreground text-xs sm:text-sm text-center">
            Thanks for dreaming with us — we&apos;re in beta, so <br /> you
            might hit a few performance bumps
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow ring-1 ring-black/5 z-30"></div>
    </>
  );
}
