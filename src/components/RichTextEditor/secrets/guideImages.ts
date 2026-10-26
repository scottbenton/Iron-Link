import { useEffect, useState } from "react";

import { RichTextSecretsService } from "services/richTextSecrets.service";

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
