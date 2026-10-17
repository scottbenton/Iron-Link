import { useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { useUID } from "stores/auth.store";
import { useUsersStore } from "stores/users.store";

import { rtcExtensions } from "./rtcExtensions";

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
  onSave?: (
    id: string,
    value: Uint8Array,
    textContent: string,
    isBeaconRequest: boolean,
  ) => Promise<void>;
  readOnly: boolean;
}): { editor: ReturnType<typeof useEditor>; saving: boolean } {
  const { documentId, roomName, roomKey, initialValue, onSave, readOnly } =
    params;

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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

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

  const handleSave = useCallback(
    (
      documentId: string,
      doc: Y.Doc,
      textContent: string,
      isBeaconRequest?: boolean,
    ) => {
      if (onSave) {
        const notes = Y.encodeStateAsUpdate(doc);

        setHasUnsavedChanges(false);
        hasUnsavedChangesRef.current = false;
        setSaving(true);
        onSave(documentId, notes, textContent, isBeaconRequest ?? false)
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            setSaving(false);
          });
      }
    },
    [onSave],
  );

  // This useEffect handles saving when the component is unmounted or the open document changes
  useEffect(() => {
    const newDoc = new Y.Doc();
    if (initialValueRef.current.length > 0) {
      Y.applyUpdate(newDoc, initialValueRef.current);
    }

    // Add update listener
    newDoc.on("update", (_, origin) => {
      // Only on changes we make, to prevent overcrowding our backend
      if (!origin.peerId) {
        setHasUnsavedChanges(true);
        hasUnsavedChangesRef.current = true;
      }
    });

    setHasUnsavedChanges(false);
    hasUnsavedChangesRef.current = false;
    setSaving(false);

    setDoc(newDoc);

    return () => {
      if (hasUnsavedChangesRef.current && textValueRef.current) {
        handleSave(documentId, newDoc, textValueRef.current);
      }

      setDoc(null);
      newDoc.destroy();
    };
  }, [documentId, handleSave]);

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

  // This useEffect handles saving when the tab is closed
  useEffect(() => {
    const onUnload = () => {
      if (
        doc &&
        document.visibilityState === "hidden" &&
        hasUnsavedChangesRef.current &&
        textValueRef.current
      ) {
        handleSave(documentId, doc, textValueRef.current, true);
      }
    };

    document.addEventListener("visibilitychange", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [doc, documentId, handleSave]);

  // This useEffect handles saving automatically when changes get made
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (hasUnsavedChanges && doc) {
      timeout = setTimeout(() => {
        if (!textValueRef.current) {
          console.error("Text value is empty, cannot save");
        } else {
          handleSave(documentId, doc, textValueRef.current);
        }
      }, AUTOSAVE_INTERVAL_SECONDS * 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [doc, hasUnsavedChanges, handleSave, documentId]);

  if (!doc) {
    return {
      editor: null,
      saving,
    };
  }

  return { editor, saving };
}
