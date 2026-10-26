import { useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { useUID } from "stores/auth.store";
import { useUsersStore } from "stores/users.store";

import type { RichTextContentStore } from "services/richTextContent.service";

import { rtcExtensions } from "./rtcExtensions";
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

export function useAutoSaveRtcEditor(params: {
  documentId: string;
  roomName: string;
  // The room's key. Until it loads, or when this user can't read it, the
  // editor works on its own; a new key rejoins without touching the doc.
  roomKey: string | null | undefined;
  initialValue: Uint8Array;
  // Where the document is saved. Without one, the editor is read-only.
  contentStore?: RichTextContentStore;
  onSaveError?: (error: unknown) => void;
}): { editor: ReturnType<typeof useEditor>; saving: boolean } {
  const {
    documentId,
    roomName,
    roomKey,
    initialValue,
    contentStore,
    onSaveError,
  } = params;
  const readOnly = !contentStore;

  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);

  const uid = useUID();
  const displayName = useUsersStore((store) =>
    uid ? store.users[uid]?.user?.name : undefined,
  );

  const initialValueRef = useRef(initialValue);
  useEffect(() => {
    if (!initialValueRef.current) {
      initialValueRef.current = initialValue;
    }
  }, [initialValue]);

  // Read through refs, so a caller passing a new store or callback doesn't
  // reopen the document.
  const contentStoreRef = useRef(contentStore);
  contentStoreRef.current = contentStore;
  const onSaveErrorRef = useRef(onSaveError);
  onSaveErrorRef.current = onSaveError;
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

  const textValueRef = useRef<string | null>(null);
  const editor = useEditor(
    {
      extensions: rtcExtensions({
        doc: doc ?? undefined,
        provider: provider ?? undefined,
        userId: uid,
        userName: displayName ?? undefined,
      }),
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        if (textValueRef.current !== text) {
          textValueRef.current = text;
        }
      },
      enablePasteRules: true,
    },
    [doc, provider, uid, displayName, readOnly],
  );

  // Merges the stored state into `saveDoc` and writes the result. Pass a copy
  // of the doc when it is about to be destroyed.
  const save = useCallback(
    (documentId: string, saveDoc: Y.Doc) => {
      const store = contentStoreRef.current;
      if (!store) return;
      markUnsaved(false);
      setSaving(true);
      saveQueueRef.current = saveQueueRef.current.then(() =>
        saveMergedRichText(
          saveDoc,
          store,
          () => textValueRef.current ?? "",
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
    const newDoc = new Y.Doc();
    if (initialValueRef.current.length > 0) {
      Y.applyUpdate(newDoc, initialValueRef.current);
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
        save(documentId, copy);
      }

      setDoc(null);
      newDoc.destroy();
    };
  }, [documentId, save, markUnsaved]);

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
            textValueRef.current ?? "",
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

  if (!doc) {
    return {
      editor: null,
      saving,
    };
  }

  return { editor, saving };
}
