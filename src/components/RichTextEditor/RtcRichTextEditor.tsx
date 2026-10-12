import { Editor as TTEditor } from "@tiptap/react";

import { Editor } from "./Editor";
import { useAutoSaveRtcEditor } from "./useAutosaveRtcEditor";

export interface RtcRichTextEditorProps {
  id: string;
  roomPrefix: string;
  documentPassword: string;
  onSave?: (
    documentId: string,
    notes: Uint8Array,
    noteContentString: string,
    isBeaconRequest?: boolean,
  ) => Promise<void>;
  initialValue: Uint8Array;
  Toolbar: React.FC<{ editor: TTEditor }>;
  // Bordered, with the toolbar inside, for an editor among other inputs.
  outlined?: boolean;
  minHeight?: number;
}

export function RtcRichTextEditor(props: RtcRichTextEditorProps) {
  const {
    id,
    roomPrefix,
    documentPassword,
    onSave,
    initialValue,
    Toolbar,
    outlined,
    minHeight,
  } = props;

  const readOnly = !onSave;
  const { editor, saving } = useAutoSaveRtcEditor({
    documentId: id,
    roomName: `${roomPrefix}-${id}`,
    roomPassword: documentPassword,
    initialValue,
    onSave,
    readOnly,
  });

  return (
    <Editor
      editable={!readOnly}
      editor={editor}
      saving={saving}
      Toolbar={Toolbar}
      outlined={outlined}
      minHeight={minHeight}
    />
  );
}
