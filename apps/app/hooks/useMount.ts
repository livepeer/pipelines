import { useEffect } from "react";

export default function useMount(callback: () => void) {
  useEffect(() => {
    callback();
  }, []);
}
