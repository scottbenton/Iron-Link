import { Editor as TTEditor } from "@tiptap/react";

import type { RichTextContentStore } from "services/richTextContent.service";
import type { RoomKeySource } from "services/roomKeys.service";

import { Editor, EditorProps } from "./Editor";
import { useAutoSaveRtcEditor } from "./useAutosaveRtcEditor";
import { useRoomKey } from "./useRoomKey";

export interface RtcRichTextEditorProps {
  id: string;
  roomPrefix: string;
  // Whose key locks the live room: the note's or entry's own, or a Guide key.
  roomKeySource: RoomKeySource;
  // Where the document is saved; saves merge with what is stored. Without
  // one, the editor is read-only.
  contentStore?: RichTextContentStore;
  onSaveError?: (error: unknown) => void;
  initialValue: Uint8Array;
  Toolbar: React.FC<{ editor: TTEditor }>;
  // Bordered, with the toolbar inside, for an editor among other inputs.
  outlined?: boolean;
  minHeight?: number;
  // Side padding for the text, so the editor can scroll at its column's edge.
  contentPx?: EditorProps["contentPx"];
  fill?: EditorProps["fill"];
}

export function RtcRichTextEditor(props: RtcRichTextEditorProps) {
  const {
    id,
    roomPrefix,
    roomKeySource,
    contentStore,
    onSaveError,
    initialValue,
    Toolbar,
    outlined,
    minHeight,
    contentPx,
    fill,
  } = props;

  const readOnly = !contentStore;
  const roomKey = useRoomKey(roomKeySource);
  const { editor, saving } = useAutoSaveRtcEditor({
    documentId: id,
    roomName: `${roomPrefix}-${id}`,
    roomKey,
    initialValue,
    contentStore,
    onSaveError,
  });

  return (
    <Editor
      editable={!readOnly}
      editor={editor}
      saving={saving}
      Toolbar={Toolbar}
      outlined={outlined}
      minHeight={minHeight}
      contentPx={contentPx}
      fill={fill}
    />
  );
}
