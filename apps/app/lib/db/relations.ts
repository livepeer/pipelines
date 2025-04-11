import { relations } from "drizzle-orm/relations";
import {
  users,
  sharedParams,
  pipelines,
  apiKeys,
  jobs,
  purchases,
  auditLogs,
  streams,
  clips,
  clipViews,
} from "./schema";

export const sharedParamsRelations = relations(sharedParams, ({ one }) => ({
  user: one(users, {
    fields: [sharedParams.author],
    references: [users.id],
  }),
  pipeline: one(pipelines, {
    fields: [sharedParams.pipeline],
    references: [pipelines.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sharedParams: many(sharedParams),
  pipelines: many(pipelines),
  apiKeys: many(apiKeys),
  jobs: many(jobs),
  purchases: many(purchases),
  auditLogs: many(auditLogs),
  streams: many(streams),
  authoredClips: many(clips, { relationName: "author" }),
  clipViews: many(clipViews, { relationName: "viewer" }),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  sharedParams: many(sharedParams),
  user: one(users, {
    fields: [pipelines.author],
    references: [users.id],
  }),
  streams: many(streams),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one }) => ({
  user: one(users, {
    fields: [streams.author],
    references: [users.id],
  }),
  pipeline: one(pipelines, {
    fields: [streams.pipelineId],
    references: [pipelines.id],
  }),
}));

export const clipsRelations = relations(clips, ({ one, many }) => ({
  author: one(users, {
    fields: [clips.author_user_id],
    references: [users.id],
    relationName: "author",
  }),
  views: many(clipViews),
  sourceClip: one(clips, {
    fields: [clips.source_clip_id],
    references: [clips.id],
    relationName: "sourceClip",
  }),
  derivedClips: many(clips, {
    relationName: "sourceClip",
  }),
}));

export const clipViewsRelations = relations(clipViews, ({ one }) => ({
  clip: one(clips, {
    fields: [clipViews.clip_id],
    references: [clips.id],
  }),
  viewer: one(users, {
    fields: [clipViews.viewer_user_id],
    references: [users.id],
    relationName: "viewer",
  }),
}));
