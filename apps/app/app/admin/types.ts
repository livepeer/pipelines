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
