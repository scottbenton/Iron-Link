import { Extensions, useEditor } from "@tiptap/react";
import { useCallback, useRef } from "react";

import { useUID } from "stores/auth.store";
import { useUsersStore } from "stores/users.store";

import type { RichTextContentStore } from "services/richTextContent.service";

import { rtcExtensions } from "./rtcExtensions";
import { useRtcDocument } from "./useRtcDocument";

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
  // More extensions for this editor. Keep the array stable; a new one
  // recreates the editor.
  extensions?: Extensions;
}): { editor: ReturnType<typeof useEditor>; saving: boolean } {
  const {
    documentId,
    roomName,
    roomKey,
    initialValue,
    contentStore,
    onSaveError,
    extensions,
  } = params;
  const readOnly = !contentStore;

  const uid = useUID();
  const displayName = useUsersStore((store) =>
    uid ? store.users[uid]?.user?.name : undefined,
  );

  const textValueRef = useRef<string | null>(null);
  const getText = useCallback(() => textValueRef.current ?? "", []);

  const { doc, provider, saving } = useRtcDocument({
    documentId,
    roomName,
    roomKey,
    initialValue,
    contentStore,
    getText,
    onSaveError,
  });

  const editor = useEditor(
    {
      extensions: [
        ...rtcExtensions({
          doc: doc ?? undefined,
          provider: provider ?? undefined,
          userId: uid,
          userName: displayName ?? undefined,
        }),
        ...(extensions ?? []),
      ],
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        if (textValueRef.current !== text) {
          textValueRef.current = text;
        }
      },
      enablePasteRules: true,
    },
    [doc, provider, uid, displayName, readOnly, extensions],
  );

  if (!doc) {
    return {
      editor: null,
      saving,
    };
  }

  return { editor, saving };
}
