import { useEffect, useState } from "react";

import {
  RichTextSecretsService,
  SecretSurface,
} from "services/richTextSecrets.service";

// An image inside a secret lives in the private guide_images bucket. Its node
// stores this prefix and the object's path, never a URL: signed URLs expire,
// and the bucket's read rule decides who may see it each time.
const GUIDE_IMAGE_PREFIX = "guide-image:";

export function toGuideImageSrc(path: string) {
  return `${GUIDE_IMAGE_PREFIX}${path}`;
}

export function isGuideImageSrc(src: unknown): src is string {
  return typeof src === "string" && src.startsWith(GUIDE_IMAGE_PREFIX);
}

function getGuideImagePath(src: string) {
  return src.slice(GUIDE_IMAGE_PREFIX.length);
}

// Whether an image in one of a surface's secrets has to be copied into the
// surface's private folder: it is a public image of the app (from the note,
// through Make secret or a paste), or a secret image of another surface,
// which Guides who can't read that surface couldn't see. Images from
// elsewhere on the web are left as they are.
export function guideImageNeedsCopy(
  surface: SecretSurface,
  src: unknown,
): src is string {
  if (typeof src !== "string") return false;
  if (isGuideImageSrc(src)) {
    const folder = RichTextSecretsService.getImageFolder(surface);
    return !getGuideImagePath(src).startsWith(`${folder}/`);
  }
  return RichTextSecretsService.isPublicImageUrl(src);
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

// Copies an image into a surface's private folder and resolves the `src` a
// block stores for the copy. The original is left where it is: other notes
// may show it.
export async function copyImageIntoSurface(
  surface: SecretSurface,
  src: string,
): Promise<string> {
  const url = isGuideImageSrc(src)
    ? await getSignedUrl(getGuideImagePath(src))
    : src;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  const extension = IMAGE_EXTENSIONS[blob.type] ?? "png";
  const file = new File([blob], `${crypto.randomUUID()}.${extension}`, {
    type: blob.type,
  });
  const path = await RichTextSecretsService.storeImage(surface, file);
  return toGuideImageSrc(path);
}

// Signed URLs last an hour; reuse one for most of that.
const URL_LIFETIME_MS = 50 * 60 * 1000;
const signedUrls = new Map<string, { url: Promise<string>; at: number }>();

function getSignedUrl(path: string) {
  const cached = signedUrls.get(path);
  if (cached && Date.now() - cached.at < URL_LIFETIME_MS) return cached.url;
  const url = RichTextSecretsService.getImageUrl(path);
  signedUrls.set(path, { url, at: Date.now() });
  url.catch(() => signedUrls.delete(path));
  return url;
}

// The URL to show an image node's `src` with: itself, or a signed URL for an
// image inside a secret (undefined while it loads or when it can't be read).
export function useImageDisplaySrc(src: unknown): string | undefined {
  const guidePath = isGuideImageSrc(src)
    ? src.slice(GUIDE_IMAGE_PREFIX.length)
    : null;
  const [signed, setSigned] = useState<{ path: string; url: string }>();

  useEffect(() => {
    if (!guidePath) return;
    let current = true;
    getSignedUrl(guidePath)
      .then((url) => {
        if (current) setSigned({ path: guidePath, url });
      })
      .catch((e) => console.error(e));
    return () => {
      current = false;
    };
  }, [guidePath]);

  if (guidePath) {
    return signed?.path === guidePath ? signed.url : undefined;
  }
  return typeof src === "string" ? src : undefined;
}
