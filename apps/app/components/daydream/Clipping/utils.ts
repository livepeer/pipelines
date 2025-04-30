import { cookies } from "next/headers";

export const SOURCE_CLIP_ID_COOKIE_NAME = "source_clip_id";
export const SOURCE_CLIP_ID_COOKIE_EXPIRATION_IN_MS = 60 * 60 * 12 * 1000; // 12 hours

export const getSourceClipIdFromCookies = () => {
  return cookies().get(SOURCE_CLIP_ID_COOKIE_NAME)?.value;
};

export const setSourceClipIdToCookies = (clipId: string) => {
  cookies().set(SOURCE_CLIP_ID_COOKIE_NAME, clipId, {
    path: "/",
    expires: new Date(Date.now() + SOURCE_CLIP_ID_COOKIE_EXPIRATION_IN_MS),
  });
};

export const deleteSourceClipIdFromCookies = () => {
  cookies().delete(SOURCE_CLIP_ID_COOKIE_NAME);
};
