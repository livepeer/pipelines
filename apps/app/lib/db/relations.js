"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipViewsRelations = exports.clipsRelations = exports.streamsRelations = exports.auditLogsRelations = exports.purchasesRelations = exports.jobsRelations = exports.apiKeysRelations = exports.pipelinesRelations = exports.usersRelations = exports.sharedParamsRelations = void 0;
const relations_1 = require("drizzle-orm/relations");
const schema_1 = require("./schema");
exports.sharedParamsRelations = (0, relations_1.relations)(schema_1.sharedParams, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.sharedParams.author],
        references: [schema_1.users.id],
    }),
    pipeline: one(schema_1.pipelines, {
        fields: [schema_1.sharedParams.pipeline],
        references: [schema_1.pipelines.id],
    }),
}));
exports.usersRelations = (0, relations_1.relations)(schema_1.users, ({ many }) => ({
    sharedParams: many(schema_1.sharedParams),
    pipelines: many(schema_1.pipelines),
    apiKeys: many(schema_1.apiKeys),
    jobs: many(schema_1.jobs),
    purchases: many(schema_1.purchases),
    auditLogs: many(schema_1.auditLogs),
    streams: many(schema_1.streams),
    authoredClips: many(schema_1.clips, { relationName: "author" }),
    clipViews: many(schema_1.clipViews, { relationName: "viewer" }),
}));
exports.pipelinesRelations = (0, relations_1.relations)(schema_1.pipelines, ({ one, many }) => ({
    sharedParams: many(schema_1.sharedParams),
    user: one(schema_1.users, {
        fields: [schema_1.pipelines.author],
        references: [schema_1.users.id],
    }),
    streams: many(schema_1.streams),
}));
exports.apiKeysRelations = (0, relations_1.relations)(schema_1.apiKeys, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.apiKeys.userId],
        references: [schema_1.users.id],
    }),
}));
exports.jobsRelations = (0, relations_1.relations)(schema_1.jobs, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.jobs.userId],
        references: [schema_1.users.id],
    }),
}));
exports.purchasesRelations = (0, relations_1.relations)(schema_1.purchases, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.purchases.userId],
        references: [schema_1.users.id],
    }),
}));
exports.auditLogsRelations = (0, relations_1.relations)(schema_1.auditLogs, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.auditLogs.userId],
        references: [schema_1.users.id],
    }),
}));
exports.streamsRelations = (0, relations_1.relations)(schema_1.streams, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.streams.author],
        references: [schema_1.users.id],
    }),
    pipeline: one(schema_1.pipelines, {
        fields: [schema_1.streams.pipelineId],
        references: [schema_1.pipelines.id],
    }),
}));
exports.clipsRelations = (0, relations_1.relations)(schema_1.clips, ({ one, many }) => ({
    author: one(schema_1.users, {
        fields: [schema_1.clips.author_user_id],
        references: [schema_1.users.id],
        relationName: "author",
    }),
    views: many(schema_1.clipViews),
    sourceClip: one(schema_1.clips, {
        fields: [schema_1.clips.source_clip_id],
        references: [schema_1.clips.id],
        relationName: "sourceClip",
    }),
    derivedClips: many(schema_1.clips, {
        relationName: "sourceClip",
    }),
}));
exports.clipViewsRelations = (0, relations_1.relations)(schema_1.clipViews, ({ one }) => ({
    clip: one(schema_1.clips, {
        fields: [schema_1.clipViews.clip_id],
        references: [schema_1.clips.id],
    }),
    viewer: one(schema_1.users, {
        fields: [schema_1.clipViews.viewer_user_id],
        references: [schema_1.users.id],
        relationName: "viewer",
    }),
}));
