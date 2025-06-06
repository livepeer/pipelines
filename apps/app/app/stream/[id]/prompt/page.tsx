"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, CheckCircle, Clock } from "lucide-react";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { usePromptQueue } from "@/app/hooks/usePromptQueue";
import {
  MAX_PROMPT_LENGTH,
  useValidateInput,
} from "@/components/welcome/featured/useValidateInput";
import { Button } from "@repo/design-system/components/ui/button";
import Image from "next/image";

export default function StreamPromptPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [promptValue, setPromptValue] = useState("");
  const [userPromptId, setUserPromptId] = useState<string | null>(null);
  const [isTextareaHighlighted, setIsTextareaHighlighted] = useState(false);

  const handleReset = () => {
    setUserPromptId(null);
  };

  const {
    currentPrompt,
    recentPrompts,
    isSubmitting,
    submitPrompt,
    getQueuePosition,
  } = usePromptQueue(streamId);

  // Find user's position in queue
  const userQueuePosition = useMemo(() => {
    if (!userPromptId) return null;
    return getQueuePosition(userPromptId);
  }, [userPromptId, getQueuePosition]);

  // Check if user's prompt is currently active
  const isUserPromptActive = useMemo(() => {
    return currentPrompt?.prompt?.id === userPromptId;
  }, [currentPrompt, userPromptId]);

  // Clear userPromptId when their prompt finishes being active
  useEffect(() => {
    if (userPromptId && currentPrompt?.prompt?.id !== userPromptId) {
      const promptStillInQueue = userQueuePosition !== undefined;
      if (!promptStillInQueue) {
        setUserPromptId(null);
      }
    }
  }, [currentPrompt, userPromptId, userQueuePosition]);

  const handleSubmitPrompt = async (text: string) => {
    const result = await submitPrompt(text);
    if (result.success && result.promptId) {
      setUserPromptId(result.promptId);
      setPromptValue("");
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Cloud-like background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-16 bg-white/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-12 bg-blue-100/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-20 bg-white/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-14 bg-blue-50/60 rounded-full blur-lg"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {!userPromptId && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md text-center"
              >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  Describe your vision
                </h2>
                <p className="text-gray-600 mb-12 text-lg">
                  Bend reality to your will
                </p>

                <PromptForm
                  onSubmitPrompt={handleSubmitPrompt}
                  isSubmitting={isSubmitting}
                  promptValue={promptValue}
                  setPromptValue={setPromptValue}
                  isTextareaHighlighted={isTextareaHighlighted}
                  canSubmit={true}
                />
              </motion.div>
            )}

            {userPromptId && !isUserPromptActive && userQueuePosition && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-sm mx-auto">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    You&apos;re in the queue
                  </h2>

                  <motion.div
                    className="text-6xl font-bold text-gray-900 mb-4"
                    key={userQueuePosition}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {userQueuePosition}
                  </motion.div>

                  <p className="text-gray-600 mb-6">
                    {userQueuePosition === 1 ? (
                      <>You&apos;re next!</>
                    ) : (
                      <>
                        {userQueuePosition - 1}
                        {userQueuePosition - 1 === 1
                          ? " person"
                          : " people"}{" "}
                        ahead of you
                      </>
                    )}
                  </p>

                  <div className="bg-gray-100 rounded-2xl p-4">
                    <p className="text-sm text-gray-700 italic">
                      &ldquo;
                      {recentPrompts.find(p => p.id === userPromptId)?.text}
                      &rdquo;
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {userPromptId && isUserPromptActive && (
              <motion.div
                key="live"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md mx-auto"
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-200 to-blue-100 rounded-full flex items-center justify-center overflow-hidden"
                  >
                    <Image
                      src="/images/cloud-icon.png"
                      alt="Prompt Icon"
                      width={32}
                      height={32}
                      className="w-9 h-9"
                    />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    You&apos;re Live!
                  </h2>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                    <p className="text-lg text-gray-800 italic">
                      &ldquo;{currentPrompt?.prompt?.content}&rdquo;
                    </p>
                  </div>

                  <p className="text-gray-600 mb-6">
                    It’s your moment! Your prompt currently is applied to the
                    stream.
                  </p>

                  <Button
                    onClick={handleReset}
                    className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all duration-300"
                  >
                    Go again
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function PromptForm({
  onSubmitPrompt,
  isSubmitting,
  promptValue,
  setPromptValue,
  isTextareaHighlighted,
  canSubmit,
}: {
  onSubmitPrompt: (text: string) => Promise<boolean>;
  isSubmitting: boolean;
  promptValue: string;
  setPromptValue: (value: string) => void;
  isTextareaHighlighted: boolean;
  canSubmit: boolean;
}) {
  const { profanity, exceedsMaxLength } = useValidateInput(promptValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (profanity || exceedsMaxLength || !promptValue.trim() || !canSubmit)
      return;

    const success = await onSubmitPrompt(promptValue);
    if (success) {
      setPromptValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        !isSubmitting &&
        promptValue.trim() &&
        !profanity &&
        !exceedsMaxLength &&
        canSubmit
      ) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(e.target.value);
  };

  const errorMsg = useMemo(() => {
    if (exceedsMaxLength) {
      return `Your prompt exceeds the maximum length of ${MAX_PROMPT_LENGTH} characters`;
    }
    if (profanity) {
      return "Please remove harmful words from your prompt";
    }
    return null;
  }, [profanity, exceedsMaxLength]);

  const isDisabled = isSubmitting || !canSubmit;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative mb-4">
        <Textarea
          ref={textareaRef}
          placeholder={isDisabled ? "Wait..." : "Anime style..."}
          className={cn(
            "w-full px-6 py-4 text-lg rounded-full border-2 bg-white/80 backdrop-blur-sm shadow-lg",
            "focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-blue-200",
            "placeholder:text-gray-400 resize-none overflow-hidden",
            profanity || exceedsMaxLength
              ? "border-red-400 bg-red-50"
              : isTextareaHighlighted
                ? "border-blue-400 shadow-[0_0_0_3px_rgba(59,130,246,0.1)] animate-pulse"
                : "border-gray-200",
            isDisabled && "opacity-60 cursor-not-allowed",
          )}
          value={promptValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          rows={1}
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          style={{
            minHeight: "60px",
          }}
        />
      </div>

      <button
        type="submit"
        className={cn(
          "w-full py-4 text-lg font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-full",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "flex items-center justify-center gap-2",
          (isDisabled ||
            !promptValue.trim() ||
            profanity ||
            exceedsMaxLength) &&
            "opacity-50 cursor-not-allowed hover:bg-gray-900",
        )}
        disabled={
          isDisabled || !promptValue.trim() || profanity || exceedsMaxLength
        }
      >
        Submit
      </button>

      {errorMsg && (
        <div className="text-xs text-red-600 mt-2 text-center">{errorMsg}</div>
      )}
    </form>
  );
}
