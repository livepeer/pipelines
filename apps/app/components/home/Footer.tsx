import { TrackedButton } from "../analytics/TrackedButton";
import { SquareDashedBottomCode, Workflow } from "lucide-react";

interface FooterProps {
  showFooter: boolean;
}

export const Footer = ({ showFooter }: FooterProps) => {
  return (
    <div 
      className={`fixed bottom-0 left-0 w-full z-[1100] bg-white/20 backdrop-blur-md flex justify-center transition-opacity duration-300 ${
        showFooter ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-6 py-4 px-4">
        <TrackedButton
          trackingEvent="footer_request_api_access_clicked"
          trackingProperties={{ location: "footer" }}
          variant="ghost"
          className="text-gray-600 rounded-xl hover:text-gray-500 transition-colors duration-200 text-medium font-medium"
          onClick={() =>
            window.open(
              "https://share.hsforms.com/2c2Uw6JsHTtiiAyAH0-4itA3o1go",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          Request API Access
          <SquareDashedBottomCode className="w-4 h-4 ml-2" />
        </TrackedButton>
        <div className="hidden md:block w-px h-6 bg-gray-300 mx-3" />
        <div className="block md:hidden w-16 h-px bg-gray-300 my-2" />
        <TrackedButton
          trackingEvent="footer_build_with_comfystream_clicked"
          trackingProperties={{ location: "footer" }}
          variant="ghost"
          className="text-gray-600 rounded-xl hover:text-gray-500 transition-colors duration-200 text-medium font-medium"
          onClick={() =>
            window.open(
              "https://comfystream.org/",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          Build with ComfyStream
          <Workflow className="w-4 h-4 ml-2" />
        </TrackedButton>
      </div>
    </div>
  );
}; 