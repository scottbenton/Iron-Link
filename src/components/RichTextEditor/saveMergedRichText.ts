import { Buffer } from "buffer";
import * as Y from "yjs";

import type { RichTextContentStore } from "services/richTextContent.service";

// The origin of updates merged in from storage, so they don't count as edits
// that need saving.
export const storedStateOrigin = { storedState: true };

const MAX_SAVE_ATTEMPTS = 5;

// Saves without overwriting anyone: reads the stored state, merges it into
// `doc` (so the editor shows edits saved elsewhere), and writes the result only
// if nothing was saved in between, retrying otherwise. Yjs merges are
// lossless, so every edit on both sides survives. Resolves the saved version.
export async function saveMergedRichText(
  doc: Y.Doc,
  store: RichTextContentStore,
  getText: () => string,
  knownUpdatedAt: string | undefined,
): Promise<string> {
  let known = knownUpdatedAt;
  for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
    const stored = await store.read(known);
    if (stored.content) {
      Y.applyUpdate(doc, stored.content, storedStateOrigin);
    }
    const saved = await store.write(
      Y.encodeStateAsUpdate(doc),
      getText(),
      stored.updatedAt,
    );
    if (saved) return saved;
    known = stored.updatedAt;
  }
  throw new Error(
    "Could not save: the document kept changing, or it is read-only",
  );
}

// Edits that may not have reached the database when the page closed. An
// unload can only send a guarded write and never learns whether it landed, so
// the state is also kept on this device and merged in when the document next
// opens here. Applying it twice is harmless.
const UNSAVED_PREFIX = "unsaved-rich-text:";

function getUnsavedKey(uid: string | undefined, documentId: string) {
  return `${UNSAVED_PREFIX}${uid ?? "anonymous"}:${documentId}`;
}

export function stashUnsavedState(
  uid: string | undefined,
  documentId: string,
  doc: Y.Doc,
) {
  try {
    localStorage.setItem(
      getUnsavedKey(uid, documentId),
      Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"),
    );
  } catch (e) {
    console.error(e);
  }
}

export function readUnsavedState(
  uid: string | undefined,
  documentId: string,
): Uint8Array | null {
  try {
    const stored = localStorage.getItem(getUnsavedKey(uid, documentId));
    return stored ? new Uint8Array(Buffer.from(stored, "base64")) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function clearUnsavedState(uid: string | undefined, documentId: string) {
  try {
    localStorage.removeItem(getUnsavedKey(uid, documentId));
  } catch (e) {
    console.error(e);
  }
}
