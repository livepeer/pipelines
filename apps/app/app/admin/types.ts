import { clipApprovalEnum } from "@/lib/db/schema";

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  author: string | { name: string };
  status: string;
  is_private: boolean;
  is_featured?: boolean;
  cover_image?: string;
  config?: any;
  prioritized_params?: any[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Clip {
  id: number;
  video_url: string;
  video_title?: string;
  thumbnail_url?: string | null;
  author_user_id: string;
  source_clip_id?: number | null;
  prompt: string;
  priority?: number | null;
  created_at: string;
  deleted_at?: string | null;
  author?: string | { id: string; name: string };
  approval_status: (typeof clipApprovalEnum.enumValues)[number];
}
