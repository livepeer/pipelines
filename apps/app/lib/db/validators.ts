import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { clips, clipViews } from "@/lib/db/schema";

export const selectClipSchema = createSelectSchema(clips, {});
export const insertClipSchema = createInsertSchema(clips, {});
export type Clip = z.infer<typeof selectClipSchema>;

export const selectClipViewsSchema = createSelectSchema(clipViews, {});
export const insertClipViewsSchema = createInsertSchema(clipViews, {});
export type ClipView = z.infer<typeof selectClipViewsSchema>;
