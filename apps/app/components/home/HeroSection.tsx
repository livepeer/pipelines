import { motion } from "framer-motion";
import { WandSparkles, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TrackedButton } from "../analytics/TrackedButton";
import { cn } from "@repo/design-system/lib/utils";
import { getIframeUrl, useMultiplayerStreamStore } from "./VideoSection";
import useMobileStore from "@/hooks/useMobileStore";
import { usePromptQueue } from "@/app/hooks/usePromptQueue";

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export const HeroSection = ({ isAuthenticated = false }: HeroSectionProps) => {
  const router = useRouter();
  const [localPrompt, setLocalPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const { currentStream } = useMultiplayerStreamStore();
  const { isMobile } = useMobileStore();
  const { submitPrompt, isSubmitting } = usePromptQueue(
    currentStream?.streamKey,
  );

  const placeholders = [
    "an art style",
    "a famous character",
    "a fantasy world",
  ];

  useEffect(() => {
    const currentPlaceholder = placeholders[placeholderIndex];

    if (!isDeleting && displayText === currentPlaceholder) {
      // Pause before starting to delete
      setTimeout(() => {
        setIsDeleting(true);
        setTypingSpeed(50);
      }, 2000);
      return;
    }
    if (isDeleting && displayText === "") {
      // Move to next placeholder after deletion
      setPlaceholderIndex(current => (current + 1) % placeholders.length);
      setIsDeleting(false);
      setTypingSpeed(100);
      return;
    }
    const timer = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(prev => prev.slice(0, -1));
      } else {
        setDisplayText(currentPlaceholder.slice(0, displayText.length + 1));
      }
    }, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, placeholderIndex, placeholders]);

  const handleSubmit = async () => {
    if (!localPrompt.trim() || isSubmitting) return;

    const success = await submitPrompt(localPrompt);
    if (success) {
      setLocalPrompt("");
      // Scroll to player section
      document.getElementById("player")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const anchor = window.location.hash;
      if (anchor === "#player") {
        document.getElementById("player")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, []);

  if (!currentStream) return null;

  return (
    <section
      className={cn(
        "relative w-full h-[100vh] flex flex-col md:px-4",
        isMobile && "h-[calc(100vh-3rem)] mt-12",
      )}
    >
      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-center sm:justify-between items-center">
        <h1
          className={cn(
            "text-2xl font-bold tracking-widest italic text-gray-800 text-center w-full sm:w-auto",
            isMobile && "hidden",
          )}
        >
          DAYDREAM
        </h1>
        <div className="hidden sm:block ml-4">
          <TrackedButton
            onClick={() => router.push("/create")}
            trackingEvent="explore_header_start_creating_clicked"
            trackingProperties={{ location: "explore_header" }}
            variant="default"
            className={cn("px-8 py-2 h-10 rounded-lg")}
          >
            {isAuthenticated ? "Create" : "Sign in"}
          </TrackedButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-800"
          >
            Transform any livestream with a prompt
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-2xl mx-auto mt-8"
          >
            <div className="relative">
              <input
                type="text"
                value={localPrompt}
                onChange={e => setLocalPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Describe ${displayText}`}
                className="w-full px-6 pr-24 py-4 text-lg bg-white/10 backdrop-blur-md rounded-full shadow-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {localPrompt === "" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-gray-400 text-lg px-6 flex items-center">
                    Describe {displayText}
                    <span className="inline-block w-[2px] h-5 bg-gray-400 ml-[1px] animate-blink mt-[2px]"></span>
                  </span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <span className="hidden sm:inline">
                  {isSubmitting ? "Submitting..." : "See transformation"}
                </span>
                <WandSparkles className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer with bouncing arrow */}
      <footer className="relative w-full flex flex-col items-center z-[1201] mb-24">
        <div
          className="w-[190px] aspect-video rounded-lg overflow-hidden shadow-lg mb-8 cursor-pointer hover:shadow-xl transition-shadow relative"
          onClick={() => {
            document.getElementById("player")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <iframe
            src={getIframeUrl({
              playbackId: currentStream?.transformedPlaybackId,
              lowLatency: true,
            })}
            className="w-full h-full absolute inset-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            scrolling="no"
          />
          <div className="absolute inset-0 z-10 bg-transparent" />
        </div>
        <motion.button
          type="button"
          onClick={() => {
            document.getElementById("player")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="focus:outline-none"
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-8 h-8 text-black/50" />
        </motion.button>
      </footer>
    </section>
  );
};
