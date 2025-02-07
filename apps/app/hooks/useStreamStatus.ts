import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useRef } from 'react';

const BASE_POLLING_INTERVAL = 5000;
const MAX_BACKOFF_INTERVAL = 120000;

export const useStreamStatus = (streamId: string, requireUser: boolean = true) => {
    const { ready, user } = usePrivy();
    const [status, setStatus] = useState<string | null>(null);
    const [fullResponse, setFullResponse] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const failureCountRef = useRef(0);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const triggerError = (errMsg: string) => {
        setError(errMsg);
        setLoading(false);
    };

    const resetPollingInterval = () => {
        // Optionally, add functionality to adjust the polling interval.
    };

    useEffect(() => {
        if (!ready || (requireUser && !user)) {
            console.log("[useStreamStatus] Not ready or user required but not detected, aborting status fetch.");
            return;
        }
        if (!streamId) return;

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
                // Store the complete data response
                setFullResponse(data);
                // Also extract the main status string for any existing UI (if needed)
                setStatus(data?.state);
                setError(null);
                failureCountRef.current = 0;
                resetPollingInterval();
            } catch (err: any) {
                triggerError(err.message);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const intervalId = setInterval(fetchStatus, BASE_POLLING_INTERVAL);
        intervalIdRef.current = intervalId;

        return () => {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        };
    }, [ready, streamId, requireUser, user]);

    return { status, fullResponse, loading, error };
};
