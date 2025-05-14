import { useState, useCallback } from "react";

interface ThrottledInputOptions {
  cooldownPeriod?: number;
}

export function useThrottledInput({
  cooldownPeriod = 5000,
}: ThrottledInputOptions = {}) {
  const [value, setValue] = useState("");
  const [lastActionTime, setLastActionTime] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);
  const [throttleTimeLeft, setThrottleTimeLeft] = useState(0);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (callback: (value: string) => void) => {
      return (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!value.trim()) return;

        const now = Date.now();
        const timeElapsed = now - lastActionTime;

        if (timeElapsed < cooldownPeriod && lastActionTime !== 0) {
          setIsThrottled(true);
          setThrottleTimeLeft(Math.ceil((cooldownPeriod - timeElapsed) / 1000));

          const countdownInterval = setInterval(() => {
            setThrottleTimeLeft(prevTime => {
              if (prevTime <= 1) {
                clearInterval(countdownInterval);
                setIsThrottled(false);
                return 0;
              }
              return prevTime - 1;
            });
          }, 1000);

          return;
        }

        callback(value);
        setValue("");
        setLastActionTime(now);
      };
    },
    [value, lastActionTime, cooldownPeriod],
  );

  return {
    value,
    setValue,
    handleChange,
    handleSubmit,
    isThrottled,
    throttleTimeLeft,
  };
}
