"use server";

import { cookies } from "next/headers";
import {
  SOURCE_CLIP_ID_COOKIE_NAME,
  SOURCE_CLIP_ID_COOKIE_EXPIRATION_IN_MS,
} from "./utils";

export const getSourceClipIdFromCookies = async () => {
  return cookies().get(SOURCE_CLIP_ID_COOKIE_NAME)?.value;
};

export const setSourceClipIdToCookies = async (clipId: string) => {
  cookies().set(SOURCE_CLIP_ID_COOKIE_NAME, clipId, {
    path: "/",
    expires: new Date(Date.now() + SOURCE_CLIP_ID_COOKIE_EXPIRATION_IN_MS),
  });
};

export const deleteSourceClipIdFromCookies = async () => {
  cookies().delete(SOURCE_CLIP_ID_COOKIE_NAME);
};
