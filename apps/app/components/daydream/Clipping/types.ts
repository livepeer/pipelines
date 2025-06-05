import { ClipRecordingMode } from "@/hooks/useVideoClip";

type ClipData = {
  clipUrl: string;
  clipFilename: string;
  inputClipUrl?: string;
  inputClipFilename?: string;
  serverClipUrl: string;
  lastSubmittedPrompt?: string;
  thumbnailUrl?: string | null;
  slug?: string;
  recordingMode?: ClipRecordingMode;
};

export type { ClipData };
