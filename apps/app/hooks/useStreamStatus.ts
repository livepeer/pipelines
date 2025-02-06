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
        
        if (!ready || (requireUser && !user)) {
            console.log("[useStreamStatus] Not ready or user required but not detected, aborting status fetch.");
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/streams/${streamId}/status`, {
                    headers: {
                        'cache-control': 'no-cache',
                        'pragma': 'no-cache',
                    },
                });
                if (!res.ok) {
                    triggerError(`Failed to fetch stream status: ${res.status} ${res.statusText}`);
                    return;
                }

                const { success, error, data } = await res.json();
                if (!success || !data) {
                    triggerError(error ?? "No stream data returned from API");
                    return;
                }
                setStatus(data?.state);
                setError(null);
                failureCountRef.current = 0;
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
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            intervalIdRef.current = setInterval(fetchStatus, nextInterval);
        };

        const resetPollingInterval = () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            intervalIdRef.current = setInterval(fetchStatus, BASE_POLLING_INTERVAL);
        };

        fetchStatus();
        intervalIdRef.current = setInterval(fetchStatus, BASE_POLLING_INTERVAL);

        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, [streamId, ready, user, requireUser]);

    return { status, loading, error };
};
