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
    const [maxStatusLevel, setMaxStatusLevel] = useState(0);
    const failureCountRef = useRef(0);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const isLive = (status === "ONLINE" || status === "DEGRADED_INFERENCE" || status === "DEGRADED_INPUT") &&
        (fullResponse?.inference_status?.fps > 0);

    useEffect(() => {
        let currentLevel = 0;
        if (status === "OFFLINE") {
            currentLevel = 1;
        } else if (status === "DEGRADED_INPUT" && fullResponse?.inference_status?.fps === 0) {
            currentLevel = 2;
        } else if ((status === "ONLINE" || status === "DEGRADED_INFERENCE") && fullResponse?.inference_status?.fps === 0) {
            currentLevel = 3;
        }
        if (currentLevel > maxStatusLevel) {
            setMaxStatusLevel(currentLevel);
        }
    }, [status, fullResponse, maxStatusLevel]);

    const getStatusMessage = () => {
        switch (maxStatusLevel) {
            case 1:
                return "Initializing your stream...";
            case 2:
                return "Your stream has started. Hang tight while we load it...";
            case 3:
                return "Almost there...";
            default:
                return "";
        }
    };

    const triggerError = (errMsg: string) => {
        setError(errMsg);
        setLoading(false);
    };

    const resetPollingInterval = () => {
        // Optinal func to adjust the polling interval.
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
                setFullResponse(data);
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

    return { 
        status, 
        fullResponse, 
        loading, 
        error,
        isLive,
        statusMessage: getStatusMessage()
    };
};
