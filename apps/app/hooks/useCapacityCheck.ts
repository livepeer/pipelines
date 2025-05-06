import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface CapacityData {
  totalContainers: number;
  inUseContainers: number;
  idleContainers: number;
}

export function useCapacityCheck() {
  const [loading, setLoading] = useState(true);
  const [hasCapacity, setHasCapacity] = useState(true);
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkCapacity = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_LIVEPEER_STUDIO_API_URL}/data/ai/capacity?nocache=${Date.now()}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error checking capacity: ${response.status}`);
        }

        const data: CapacityData = await response.json();
        setCapacityData(data);

        const minCapacityParam = searchParams.get("minCapacity");
        const minCapacity = minCapacityParam
          ? parseInt(minCapacityParam, 10)
          : 0;

        // There are currently issues with the reported capacity and machines that are
        // reporting having capacity when broken. Because of this, we err on the side of caution
        // and check if we're over 80% of capacity before returning false.
        setHasCapacity(data.idleContainers - 0.2 * data.totalContainers > minCapacity);
      } catch (err) {
        console.error("Failed to check capacity:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error(
          "Fail open - Capacity check failed and set hasCapacity to true",
        );
        // Fail open
        setHasCapacity(true);
      } finally {
        setLoading(false);
      }
    };

    checkCapacity();
  }, [searchParams]);

  return { loading, hasCapacity, capacityData, error };
}
