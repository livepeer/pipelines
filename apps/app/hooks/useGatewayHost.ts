// hooks/useGatewayHost.ts
import { useState, useEffect, useCallback } from "react";
import { getStream } from "@/app/api/streams/get";

export function useGatewayHost(
  streamId: string | null,
  delayAfterReady = 3000,
) {
  const [gatewayHost, setGatewayHost] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!streamId) {
      return;
    }

    const MAX_RETRIES = 15;
    const RETRY_DELAY = 2000;
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkGatewayHost = async () => {
      if (!mounted) return;

      setLoading(true);

      try {
        const { data, error } = await getStream(streamId);

        if (error) {
          throw new Error(`Error fetching stream: ${error}`);
        }

        if (data?.gateway_host) {
          setGatewayHost(data.gateway_host);
          setLoading(false);
          setError(null);

          // Add delay before setting ready to true to make sure the gateway is ready
          setTimeout(() => {
            if (mounted) {
              setReady(true);
            }
          }, delayAfterReady);

          return;
        }

        if (retryCount < MAX_RETRIES) {
          timeoutId = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, RETRY_DELAY);
        } else {
          throw new Error("Timeout waiting for gateway host");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    checkGatewayHost();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [streamId, retryCount, delayAfterReady]);

  const executeWhenReady = useCallback(
    async (callback: (host: string) => Promise<void> | void) => {
      if (ready && gatewayHost) {
        return callback(gatewayHost);
      }
      return Promise.reject(new Error("Gateway host not available"));
    },
    [ready, gatewayHost],
  );

  const whenReady = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      if (ready && gatewayHost) {
        resolve(gatewayHost);
      } else if (error) {
        reject(new Error(error));
      } else {
        const checkInterval = setInterval(() => {
          if (ready && gatewayHost) {
            clearInterval(checkInterval);
            resolve(gatewayHost);
          } else if (error) {
            clearInterval(checkInterval);
            reject(new Error(error));
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Timeout waiting for gateway host"));
        }, 30000); // 30-second max wait
      }
    });
  }, [ready, gatewayHost, error]);

  return {
    gatewayHost,
    loading,
    error,
    ready,
    executeWhenReady,
    whenReady,
  };
}
