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
} as const;

type ResourceType = keyof typeof prefixes;

export function newId(resource: ResourceType): string {
  return `${prefixes[resource]}_${nanoid()}`;
}
