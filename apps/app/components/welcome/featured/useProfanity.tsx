import { useCallback, useEffect, useState } from "react";
import { PROFANITY_WORD_LIST } from "./utils";

export const useProfanity = (prompt: string) => {
  const [profanity, setProfanity] = useState(false);

  const checkProfanity = useCallback((prompt: string) => {
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const hasProfanity = Object.values(PROFANITY_WORD_LIST)
      .flat()
      .some((harmfulWord) => promptWords.includes(harmfulWord.toLowerCase()));
    setProfanity(hasProfanity);
  }, []);

  useEffect(() => {
    checkProfanity(prompt);
  }, [prompt]);

  return profanity;
};
