import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import useMount from "./useMount";
import { useEffect } from "react";

interface SessionIdStore {
  sessionId: string | null;
  initializeSessionId: () => void;
}

export const useSessionIdStore = create<SessionIdStore>()(
  persist(
    (set, get) => ({
      sessionId: null,

      initializeSessionId: () => {
        if (get().sessionId) {
          return;
        }

        set({ sessionId: uuidv4() });
      },
    }),
    {
      name: "mixpanel-session-id-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({ sessionId: state.sessionId }),
    },
  ),
);

interface DistinctIdStore {
  distinctId: string | null;
  initializeDistinctId: () => void;
}

export const useDistinctIdStore = create<DistinctIdStore>()(
  persist(
    (set, get) => ({
      distinctId: null,

      initializeDistinctId: () => {
        if (get().distinctId) {
          return;
        }

        set({ distinctId: uuidv4() });
      },
    }),
    {
      name: "mixpanel-distinct-id-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ distinctId: state.distinctId }),
    },
  ),
);

export const useMixpanelStore = () => {
  const sessionId = useSessionIdStore(state => state.sessionId);
  const initializeSessionId = useSessionIdStore(
    state => state.initializeSessionId,
  );
  const distinctId = useDistinctIdStore(state => state.distinctId);
  const initializeDistinctId = useDistinctIdStore(
    state => state.initializeDistinctId,
  );

  useEffect(() => {
    initializeSessionId();
    initializeDistinctId();
  }, [initializeSessionId, initializeDistinctId]);

  return { sessionId, distinctId };
};
