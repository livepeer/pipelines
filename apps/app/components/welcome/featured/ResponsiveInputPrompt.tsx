"use client";

import useMobileStore from "@/hooks/useMobileStore";
import { InputPrompt } from "./InputPrompt";
import { MobileInputPrompt } from "./MobileInputPrompt";

interface ResponsiveInputPromptProps {
  onPromptSubmit?: () => void;
}

export const ResponsiveInputPrompt = ({
  onPromptSubmit,
}: ResponsiveInputPromptProps) => {
  const { isMobile } = useMobileStore();

  return isMobile ? (
    <MobileInputPrompt onPromptSubmit={onPromptSubmit} />
  ) : (
    <InputPrompt onPromptSubmit={onPromptSubmit} />
  );
};
