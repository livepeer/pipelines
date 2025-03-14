import Image from "next/image";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";

export default function CameraAccess() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 bg-[#E1E6E9] border border-[#C5C2C2] rounded-lg p-4">
        <div className="relative w-6 h-6">
          <Image
            src="/icons/camera.svg"
            alt="Camera"
            fill
            className="[stroke:#7196A7] [stroke-width:2px]"
          />
        </div>
        <div
          className={`flex flex-col gap-2 ${isMobile ? "flex-1" : "w-[586px]"}`}
        >
          <h3
            className={`font-playfair font-semibold ${isMobile ? "text-sm" : "text-lg"} tracking-[-1.1%] text-left`}
          >
            We will need access to your Camera & Microphone
          </h3>
          <p className="font-inter text-xs leading-[1.55] tracking-[-1.1%] text-[#161616]">
            In order to transform your video we need access to these devices
          </p>
        </div>
        <button className="flex justify-center items-center gap-2 bg-[#EDEDED] rounded-md p-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="relative w-4 h-4 text-black">
            <Image
              src="/icons/refresh.svg"
              alt="Refresh"
              fill
              className="[stroke:#161616] [stroke-width:1px] [stroke-thickness:4px]"
            />
          </div>
        </button>
      </div>
    </div>
  );
}
