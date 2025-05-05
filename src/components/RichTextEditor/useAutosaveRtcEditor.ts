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
  roomPassword: string;
  initialValue: Uint8Array;
  onSave?: (
    id: string,
    value: Uint8Array,
    textContent: string,
    isBeaconRequest: boolean,
  ) => Promise<void>;
  readOnly: boolean;
}): { editor: ReturnType<typeof useEditor>; saving: boolean } {
  const { documentId, roomName, roomPassword, initialValue, onSave, readOnly } =
    params;

  const [docAndProvider, setDocAndProvider] = useState<{
    doc: Y.Doc;
    provider: WebrtcProvider;
  } | null>(null);

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
        doc: docAndProvider?.doc,
        provider: docAndProvider?.provider,
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
    [docAndProvider, uid, displayName, readOnly],
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

    const newProvider = new WebrtcProvider(roomName, newDoc, {
      password: roomPassword,
      signaling: [SIGNALING_SERVER_URL],
    });

    setHasUnsavedChanges(false);
    hasUnsavedChangesRef.current = false;
    setSaving(false);

    setDocAndProvider({ doc: newDoc, provider: newProvider });

    return () => {
      if (hasUnsavedChangesRef.current && textValueRef.current) {
        handleSave(documentId, newDoc, textValueRef.current);
      }

      newProvider.destroy();
      newDoc.destroy();
    };
  }, [documentId, roomName, roomPassword, handleSave]);

  // This useEffect handles saving when the tab is closed
  useEffect(() => {
    const onUnload = () => {
      if (
        docAndProvider &&
        document.visibilityState === "hidden" &&
        hasUnsavedChangesRef.current &&
        textValueRef.current
      ) {
        handleSave(documentId, docAndProvider.doc, textValueRef.current, true);
      }
    };

    document.addEventListener("visibilitychange", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [docAndProvider, documentId, handleSave]);

  // This useEffect handles saving automatically when changes get made
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (hasUnsavedChanges && docAndProvider) {
      const doc = docAndProvider.doc;
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
  }, [docAndProvider, hasUnsavedChanges, handleSave, documentId]);

  if (!docAndProvider) {
    return {
      editor: null,
      saving,
    };
  }

  return { editor, saving };
}
