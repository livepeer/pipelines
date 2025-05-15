import { motion } from "framer-motion";
import { WandSparkles, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrackedButton } from "../analytics/TrackedButton";
import VideoAISparkles from "../daydream/CustomIcons/VideoAISparkles";
import { cn } from "@repo/design-system/lib/utils";

interface HeroSectionProps {
  handlePromptSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  promptValue: string;
  setPromptValue: (value: string) => void;
  submitPromptForm: () => void;
}

export const HeroSection = ({ handlePromptSubmit, promptValue, setPromptValue, submitPromptForm }: HeroSectionProps) => {
  const router = useRouter();
  const [localPrompt, setLocalPrompt] = useState("");

  const handleSubmit = () => {
    if (localPrompt.trim()) {
      setPromptValue(localPrompt);
      setTimeout(() => {
        submitPromptForm();
      }, 0);
      document.getElementById('main-content')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="relative w-full h-screen flex flex-col">
      {/* Header */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-center sm:justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest italic text-gray-800 text-center w-full sm:w-auto">DAYDREAM</h1>
        <div className="hidden sm:block ml-4">
          <TrackedButton
            onClick={() => router.push("/create")}
            trackingEvent="explore_header_start_creating_clicked"
            trackingProperties={{ location: "explore_header" }}
            variant="outline"
            className={cn(
              "alwaysAnimatedButton",
              "px-4",
            )}
          >
            Sign in
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
            <input
              type="text"
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type any idea you have"
              className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-md rounded-full shadow-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
            >
              <span className="hidden sm:inline">See it in action</span>
              <WandSparkles className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer with bouncing arrow */}
      <footer className="relative w-full flex justify-center z-[1201] mb-24">
        <motion.button
          type="button"
          onClick={() => {
            document.getElementById('main-content')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
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