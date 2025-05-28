"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertClipViewsSchema =
  exports.selectClipViewsSchema =
  exports.insertClipSchema =
  exports.selectClipSchema =
    void 0;
const drizzle_zod_1 = require("drizzle-zod");
const schema_1 = require("@/lib/db/schema");
exports.selectClipSchema = (0, drizzle_zod_1.createSelectSchema)(
  schema_1.clips,
  {},
);
exports.insertClipSchema = (0, drizzle_zod_1.createInsertSchema)(
  schema_1.clips,
  {},
);
exports.selectClipViewsSchema = (0, drizzle_zod_1.createSelectSchema)(
  schema_1.clipViews,
  {},
);
exports.insertClipViewsSchema = (0, drizzle_zod_1.createInsertSchema)(
  schema_1.clipViews,
  {},
);
