import { useCallback, useState } from "react";

export type Clip = {
  id: string;
  src: string;
  title: string;
};

export default function useClipsFetcher() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchClips = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/clips?page=${page}&limit=12`);
      const data = await response.json();

      setClips(prev => [...prev, ...data.clips]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error("Failed to fetch clips:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return {
    clips,
    loading,
    hasMore,
    fetchClips,
  };
}
