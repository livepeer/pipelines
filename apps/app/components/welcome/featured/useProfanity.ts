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
  const [filteredPrompt, setFilteredPrompt] = useState("");

  const checkProfanity = () => {
    const words = prompt.toLowerCase().split(/\s+/);
    const profanityWords = Object.values(PROFANITY_WORD_LIST)
      .flat()
      .map((word) => word.toLowerCase());

    const filtered = words.filter((word) => !profanityWords.includes(word));
    const hasProfanity = filtered.length < words.length;

    setProfanity(hasProfanity);
    setFilteredPrompt(filtered.join(" "));
  };

  useEffect(() => {
    const debouncedCheck = debounce(checkProfanity, 300);
    debouncedCheck();
  }, [prompt]);

  return { profanity, filteredPrompt };
};
