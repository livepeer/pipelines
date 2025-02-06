import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useRef } from 'react';

const BASE_POLLING_INTERVAL = 5000;
const MAX_BACKOFF_INTERVAL = 120000;

export const useStreamStatus = (streamId: string, requireUser: boolean = true) => {
    const { ready, user } = usePrivy();
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const failureCountRef = useRef(0);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log("[useStreamStatus] Hook initiated with streamId:", streamId);
        console.log("[useStreamStatus] ready:", ready, "user:", user, "requireUser:", requireUser);
        
        if (!ready || (requireUser && !user)) {
            console.log("[useStreamStatus] Not ready or user required but not detected, aborting status fetch.");
            return;
        }

        const fetchStatus = async () => {
            console.log("[useStreamStatus] Attempting to fetch status for streamId:", streamId);
            try {
                const res = await fetch(`/api/streams/${streamId}/status`, {
                    headers: {
                        'cache-control': 'no-cache',
                        'pragma': 'no-cache',
                    },
                });
                console.log("[useStreamStatus] Response received:", res);
                if (!res.ok) {
                    triggerError(`Failed to fetch stream status: ${res.status} ${res.statusText}`);
                    return;
                }

                const { success, error, data } = await res.json();
                console.log("[useStreamStatus] JSON data received:", { success, error, data });
                if (!success || !data) {
                    triggerError(error ?? "No stream data returned from API");
                    return;
                }
                setStatus(data?.state);
                setError(null);
                failureCountRef.current = 0;
                console.log("[useStreamStatus] Stream status updated to:", data?.state);
                resetPollingInterval();
            } catch (err: any) {
                triggerError(err.message);
                setLoading(false);
            }
        };

        const triggerError = (errorMsg: string) => {
            console.log("[useStreamStatus] Error:", errorMsg);
            setError(errorMsg);
            failureCountRef.current += 1;
            adjustPollingInterval();
        };

        const adjustPollingInterval = () => {
            const nextInterval = Math.min(
                BASE_POLLING_INTERVAL * 2 ** failureCountRef.current,
                MAX_BACKOFF_INTERVAL
            );
            console.log("[useStreamStatus] Adjusting polling interval to:", nextInterval, "ms");
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            intervalIdRef.current = setInterval(fetchStatus, nextInterval);
        };

        const resetPollingInterval = () => {
            console.log("[useStreamStatus] Reset polling interval to base:", BASE_POLLING_INTERVAL, "ms");
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            intervalIdRef.current = setInterval(fetchStatus, BASE_POLLING_INTERVAL);
        };

        fetchStatus();
        intervalIdRef.current = setInterval(fetchStatus, BASE_POLLING_INTERVAL);

        return () => {
            if (intervalIdRef.current) {
                console.log("[useStreamStatus] Clearing polling interval.");
                clearInterval(intervalIdRef.current);
            }
        };
    }, [streamId, ready, user, requireUser]);

    return { status, loading, error };
};
