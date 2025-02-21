import { useCallback, useEffect, useState } from "react";
import { PROFANITY_WORD_LIST } from "./utils";

export const MAX_PROMPT_LENGTH = 490;

export const useValidateInput = (prompt: string) => {
  const [profanity, setProfanity] = useState(false);
  const [exceedsMaxLength, setExceedsMaxLength] = useState(false);

  const checkProfanity = useCallback((prompt: string) => {
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const hasProfanity = Object.values(PROFANITY_WORD_LIST)
      .flat()
      .some((harmfulWord) => promptWords.includes(harmfulWord.toLowerCase()));
    setProfanity(hasProfanity);
  }, []);

  const checkMaxLength = useCallback((prompt: string) => {
    setExceedsMaxLength(prompt.length > MAX_PROMPT_LENGTH);
  }, []);

  useEffect(() => {
    checkProfanity(prompt);
    checkMaxLength(prompt);
  }, [prompt]);

  return {
    profanity,
    exceedsMaxLength,
  };
};
