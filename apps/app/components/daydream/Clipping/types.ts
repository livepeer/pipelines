import { ClipRecordingMode } from "@/hooks/useVideoClip";

type ClipData = {
  id: string;
  clipUrl: string;
  clipFilename: string;
  serverClipUrl: string;
  lastSubmittedPrompt?: string;
  thumbnailUrl?: string | null;
  slug?: string;
  recordingMode?: ClipRecordingMode;
};

export type { ClipData };
