import { useEffect, useState } from "react";
import { PROFANITY_WORD_LIST } from "./utils";

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export const useProfanity = (prompt: string) => {
  const [profanity, setProfanity] = useState(false);

  const checkProfanity = () => {
    const profanity = Object.values(PROFANITY_WORD_LIST)
      .flat()
      .some((word) => prompt.toLowerCase().includes(word.toLowerCase()));
    setProfanity(profanity);
  };

  useEffect(() => {
    const debouncedCheck = debounce(checkProfanity, 300);
    debouncedCheck();
  }, [prompt]);

  return profanity;
};
