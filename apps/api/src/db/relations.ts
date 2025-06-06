import { relations } from "drizzle-orm/relations";
import {
  users,
  clips,
  apiKeys,
  auditLogs,
  clipViews,
  jobs,
  pipelines,
  purchases,
  sharedParams,
  streams,
  clipSlugs,
} from "./schema";

export const clipsRelations = relations(clips, ({ one, many }) => ({
  user_approvedBy: one(users, {
    fields: [clips.approvedBy],
    references: [users.id],
    relationName: "clips_approvedBy_users_id",
  }),
  user_authorUserId: one(users, {
    fields: [clips.authorUserId],
    references: [users.id],
    relationName: "clips_authorUserId_users_id",
  }),
  clip: one(clips, {
    fields: [clips.sourceClipId],
    references: [clips.id],
    relationName: "clips_sourceClipId_clips_id",
  }),
  clips: many(clips, {
    relationName: "clips_sourceClipId_clips_id",
  }),
  clipViews: many(clipViews),
  clipSlugs: many(clipSlugs),
}));

export const usersRelations = relations(users, ({ many }) => ({
  clips_approvedBy: many(clips, {
    relationName: "clips_approvedBy_users_id",
  }),
  clips_authorUserId: many(clips, {
    relationName: "clips_authorUserId_users_id",
  }),
  apiKeys: many(apiKeys),
  auditLogs: many(auditLogs),
  clipViews: many(clipViews),
  jobs: many(jobs),
  pipelines: many(pipelines),
  purchases: many(purchases),
  sharedParams: many(sharedParams),
  streams: many(streams),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const clipViewsRelations = relations(clipViews, ({ one }) => ({
  clip: one(clips, {
    fields: [clipViews.clipId],
    references: [clips.id],
  }),
  user: one(users, {
    fields: [clipViews.viewerUserId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  user: one(users, {
    fields: [jobs.userId],
    references: [users.id],
  }),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  user: one(users, {
    fields: [pipelines.author],
    references: [users.id],
  }),
  sharedParams: many(sharedParams),
  streams: many(streams),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

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

export const clipSlugsRelations = relations(clipSlugs, ({ one }) => ({
  clip: one(clips, {
    fields: [clipSlugs.clipId],
    references: [clips.id],
  }),
}));
