import { TrackedButton } from "../analytics/TrackedButton";
import { SquareDashedBottomCode, Workflow } from "lucide-react";

interface FooterProps {
  showFooter: boolean;
  isMobile?: boolean;
}

export const Footer = ({ showFooter, isMobile = false }: FooterProps) => {
  return (
    <div
      style={{
        width: isMobile ? "100%" : "calc(100vw - 15px)",
        paddingBottom: isMobile
          ? "env(safe-area-inset-bottom, 16px)"
          : undefined,
      }}
      className={`fixed bottom-0 left-0 z-30 ${isMobile ? "bg-white" : "bg-white/20 backdrop-blur-md"} flex justify-center transition-opacity duration-300 ${
        showFooter ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-row items-center gap-2 md:gap-6 py-2 px-4">
        <TrackedButton
          trackingEvent="footer_request_api_access_clicked"
          trackingProperties={{ location: "footer" }}
          variant="ghost"
          className={`${isMobile ? "text-sm" : "text-medium"} text-gray-600 rounded-xl hover:text-gray-500 transition-colors duration-200 font-medium`}
          onClick={() =>
            window.open(
              "https://share.hsforms.com/2c2Uw6JsHTtiiAyAH0-4itA3o1go",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          {isMobile ? "API access" : "Request API Access"}
          <SquareDashedBottomCode className="w-4 h-4 ml-2" />
        </TrackedButton>
        <div className="w-px h-6 bg-gray-300 mx-3" />
        <TrackedButton
          trackingEvent="footer_build_with_comfystream_clicked"
          trackingProperties={{ location: "footer" }}
          variant="ghost"
          className={`${isMobile ? "text-sm" : "text-medium"} text-gray-600 rounded-xl hover:text-gray-500 transition-colors duration-200 font-medium`}
          onClick={() =>
            window.open(
              "https://comfystream.org/",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          {isMobile ? "Build" : "Build with ComfyStream"}
          <Workflow className="w-4 h-4 ml-2" />
        </TrackedButton>
      </div>
    </div>
  );
};
