"use strict";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  16,
);

const prefixes = {
  stream: "str",
  pipeline: "pip",
  stream_key: "stk",
  webhook: "whk",
  api_key: "lp",
  shared: "shp",
};

export function newId(resource) {
  return `${prefixes[resource]}_${nanoid()}`;
}
