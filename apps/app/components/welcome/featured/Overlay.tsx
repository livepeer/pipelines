import { Logo } from "@/components/sidebar";

interface OverlayProps {
  statusMessage: string;
}

export default function Overlay({ statusMessage }: OverlayProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-[6]"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        background:
          "linear-gradient(118.41deg, #F1F1F1 7.25%, #83A5B5 54.22%, #E5ECEE 85.82%)",
      }}
    >
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
          Thanks for dreaming with us — we're in beta, so <br /> you might hit a
          few performance bumps
        </p>
      </div>
    </div>
  );
}
