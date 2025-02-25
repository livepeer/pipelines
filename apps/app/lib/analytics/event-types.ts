export type TrackEventName =
  | "page_view"
  | "daydream_page_view"
  | "home_page_view"
  | "create_stream_page_viewed"
  | "pipeline_viewed"
  | "daydream_prompt_submitted" 
  | "daydream_stream_started"
  | "daydream_capacity_reached"
  | "capacity_reached"
  | "button_clicked"
  | "github_button_clicked"
  | "explore_button_clicked"
  | "community_button_clicked"
  | "form_submitted"
  | "input_changed"
  | "input_focused"
  
  // Allow string extensions (enables adding new events without updating this file)
  | (string & {});

export interface TrackProperties {
  [key: string]: any;
} 