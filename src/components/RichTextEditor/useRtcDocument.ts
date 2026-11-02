import { useCallback, useEffect, useRef, useState } from "react";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { useUID } from "stores/auth.store";

import type { RichTextContentStore } from "services/richTextContent.service";

import {
  clearUnsavedState,
  readUnsavedState,
  saveMergedRichText,
  stashUnsavedState,
  storedStateOrigin,
} from "./saveMergedRichText";

// TODO - consider moving this to a config file
const SIGNALING_SERVER_URL = "wss://y-webrtc-signalling-server.onrender.com";
const AUTOSAVE_INTERVAL_SECONDS = 30;

// One rich text Yjs document: opened from its stored state plus any edits
// stashed on this device, saved by merging with what is stored, and shared
// live in a room once the room's key loads. An editor binds to `doc`.
export function useRtcDocument(params: {
  documentId: string;
  roomName: string;
  // The room's key. Until it loads, or when this user can't read it, the
  // document works on its own; a new key rejoins without touching the doc.
  roomKey: string | null | undefined;
  // The stored state to open from. Until it is set, no document is open.
  initialValue: Uint8Array | null;
  // Where the document is saved. Without one, it is never saved.
  contentStore?: RichTextContentStore;
  // The document's plain text, written beside it on each save.
  getText: () => string;
  onSaveError?: (error: unknown) => void;
}): { doc: Y.Doc | null; provider: WebrtcProvider | null; saving: boolean } {
  const {
    documentId,
    roomName,
    roomKey,
    initialValue,
    contentStore,
    getText,
    onSaveError,
  } = params;

  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);

  const uid = useUID();

  // The value a document opened from. A later initial value for the same
  // document is ignored: the open doc already holds it, and more.
  const initialValueRef = useRef<{
    documentId: string;
    value: Uint8Array;
  } | null>(null);
  if (initialValue && initialValueRef.current?.documentId !== documentId) {
    initialValueRef.current = { documentId, value: initialValue };
  }
  const isOpenable = initialValueRef.current?.documentId === documentId;

  // Read through refs, so a caller passing a new store or callback doesn't
  // reopen the document.
  const contentStoreRef = useRef(contentStore);
  contentStoreRef.current = contentStore;
  const onSaveErrorRef = useRef(onSaveError);
  onSaveErrorRef.current = onSaveError;
  const getTextRef = useRef(getText);
  getTextRef.current = getText;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  // The stored version this client last wrote, which its doc holds.
  const knownUpdatedAtRef = useRef<string | undefined>(undefined);
  // Saves run one at a time, so each starts from the version the last wrote.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const markUnsaved = useCallback((unsaved: boolean) => {
    setHasUnsavedChanges(unsaved);
    hasUnsavedChangesRef.current = unsaved;
  }, []);

  // Merges the stored state into `saveDoc` and writes the result. Pass a copy
  // of the doc when it is about to be destroyed, with its text.
  const save = useCallback(
    (documentId: string, saveDoc: Y.Doc, text?: string) => {
      const store = contentStoreRef.current;
      if (!store) return;
      markUnsaved(false);
      setSaving(true);
      saveQueueRef.current = saveQueueRef.current.then(() =>
        saveMergedRichText(
          saveDoc,
          store,
          () => text ?? getTextRef.current(),
          knownUpdatedAtRef.current,
        )
          .then((updatedAt) => {
            knownUpdatedAtRef.current = updatedAt;
            clearUnsavedState(uidRef.current, documentId);
          })
          .catch((e) => {
            console.error(e);
            markUnsaved(true);
            onSaveErrorRef.current?.(e);
          })
          .finally(() => {
            setSaving(false);
          }),
      );
    },
    [markUnsaved],
  );

  // This useEffect opens the document, and saves it when the component is
  // unmounted or the open document changes
  useEffect(() => {
    const initial = initialValueRef.current;
    if (!isOpenable || !initial) return;
    const newDoc = new Y.Doc();
    if (initial.value.length > 0) {
      Y.applyUpdate(newDoc, initial.value);
    }
    knownUpdatedAtRef.current = undefined;
    saveQueueRef.current = Promise.resolve();
    markUnsaved(false);
    setSaving(false);

    // Add update listener
    newDoc.on("update", (_, origin) => {
      // Only on changes we make, to prevent overcrowding our backend
      if (origin !== storedStateOrigin && !origin?.peerId) {
        markUnsaved(true);
      }
    });

    // Edits from an earlier visit that may never have been saved.
    const unsaved = contentStoreRef.current
      ? readUnsavedState(uidRef.current, documentId)
      : null;
    if (unsaved) {
      try {
        Y.applyUpdate(newDoc, unsaved);
      } catch (e) {
        console.error(e);
        clearUnsavedState(uidRef.current, documentId);
      }
    }

    setDoc(newDoc);

    // Save what was recovered at once. Otherwise the first save reads the
    // stored state in full, since this client doesn't know its version yet.
    if (unsaved) {
      save(documentId, newDoc);
    }

    return () => {
      if (hasUnsavedChangesRef.current) {
        const copy = new Y.Doc();
        Y.applyUpdate(copy, Y.encodeStateAsUpdate(newDoc));
        save(documentId, copy, getTextRef.current());
      }

      setDoc(null);
      newDoc.destroy();
    };
  }, [documentId, save, markUnsaved, isOpenable]);

  // The live room, joined once its key loads and rejoined after a rotation.
  // The doc outlives it, so edits made meanwhile are kept and sync on rejoin.
  useEffect(() => {
    if (!doc || !roomKey) return;
    const newProvider = new WebrtcProvider(roomName, doc, {
      password: roomKey,
      signaling: [SIGNALING_SERVER_URL],
    });
    // Destroying the doc destroys its provider, and y-webrtc's destroy is not
    // safe to repeat.
    let docDestroyed = false;
    const onDocDestroy = () => {
      docDestroyed = true;
    };
    doc.on("destroy", onDocDestroy);
    setProvider(newProvider);
    return () => {
      doc.off("destroy", onDocDestroy);
      setProvider(null);
      if (!docDestroyed) newProvider.destroy();
    };
  }, [doc, roomName, roomKey]);

  // This useEffect handles saving when the tab is closed. There is no time to
  // read and merge, so it sends a write guarded by the last known version and
  // keeps the state on this device in case that write loses.
  useEffect(() => {
    const onUnload = () => {
      const store = contentStoreRef.current;
      if (
        doc &&
        store &&
        document.visibilityState === "hidden" &&
        hasUnsavedChangesRef.current
      ) {
        stashUnsavedState(uidRef.current, documentId, doc);
        if (knownUpdatedAtRef.current) {
          store.writeBeacon(
            Y.encodeStateAsUpdate(doc),
            getTextRef.current(),
            knownUpdatedAtRef.current,
          );
        }
      }
    };

    document.addEventListener("visibilitychange", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [doc, documentId]);

  // This useEffect handles saving automatically when changes get made
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (hasUnsavedChanges && doc) {
      timeout = setTimeout(() => {
        save(documentId, doc);
      }, AUTOSAVE_INTERVAL_SECONDS * 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [doc, hasUnsavedChanges, save, documentId]);

  return { doc, provider, saving };
}
