import { useCallback, useState, useRef } from "react";

export type Clip = {
  id: string;
  video_url: string;
  video_title: string | null;
  created_at: string;
  prompt?: string;
  author_name: string | null;
  author_details?: Record<string, any>;
  remix_count: number;
  slug: string | null;
  priority: number | null;
  is_tutorial?: boolean;
};

export default function useClipsFetcher(initialClips: Clip[] = []) {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isFirstFetch = useRef(true);

  const fetchClips = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/clips?page=${page}&limit=12`);
      const data = await response.json();

      if (!data.clips || data.clips.length === 0) {
        setHasMore(false);
      } else {
        const newClips = data.clips.map(
          (clip: {
            id: number | string;
            video_url: string;
            video_title?: string;
            created_at?: string | Date;
            prompt?: string;
            author_name?: string | null;
            author_details?: Record<string, any>;
            remix_count: number;
            slug: string | null;
            is_tutorial?: boolean;
            [key: string]: any;
          }) => ({
            ...clip,
            id: String(clip.id),
            created_at: clip.created_at
              ? new Date(clip.created_at).toISOString()
              : new Date().toISOString(),
            video_title: clip.video_title,
            video_url: clip.video_url,
            prompt: clip.prompt || "",
            author_name: clip.author_name || null,
            author_details: clip.author_details,
            remix_count: clip.remix_count,
            slug: clip.slug,
            is_tutorial: clip.is_tutorial || false,
          }),
        );

        setClips(prev => {
          if (isFirstFetch.current) {
            isFirstFetch.current = false;
            return newClips;
          }

          const existingIds = new Set(prev.map(clip => clip.id));
          const uniqueNewClips = newClips.filter(
            (clip: Clip) => !existingIds.has(clip.id),
          );
          return [...prev, ...uniqueNewClips];
        });

        setHasMore(data.hasMore);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to fetch clips:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  return {
    clips,
    loading,
    hasMore,
    fetchClips,
    page,
  };
}
