import { useCallback, useEffect, useState } from "react";

export const useFetch = <T>(callback: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callback();
      setData(data as T);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [callback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
};
