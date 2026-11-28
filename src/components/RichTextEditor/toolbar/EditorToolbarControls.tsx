import type { Editor } from "@tiptap/react";

import { ToolbarSeparator } from "ui/components/Toolbar";

import type { SecretsToolbarState } from "../richTextToolbar";
import { FormattingControls } from "./FormattingControls";
import { InsertControls } from "./InsertControls";
import { TextTypeMenu } from "./TextTypeMenu";

export interface EditorToolbarControlsProps {
  editor: Editor;
  /** Stores an image where the note's owner keeps them; see UploadImageButton. */
  upload: (file: File) => Promise<string>;
  secrets?: SecretsToolbarState;
  /** Shows the text type as an icon, for a phone's bar. */
  compact?: boolean;
}

/**
 * The rich text editor's controls: text type, formatting, then images and
 * secrets. They have no toolbar of their own, so they join whichever one
 * holds them (a strip on the page, or the phone's keyboard bar). Formatting
 * acts on the caret, so a reader's note offers only what secrets allow.
 */
export function EditorToolbarControls(props: EditorToolbarControlsProps) {
  const { editor, upload, secrets, compact } = props;
  const formatting = editor.isEditable;

  return (
    <>
      {formatting && (
        <>
          <TextTypeMenu editor={editor} compact={compact} />
          <ToolbarSeparator />
          <FormattingControls editor={editor} />
          <ToolbarSeparator />
        </>
      )}
      <InsertControls editor={editor} upload={upload} secrets={secrets} />
    </>
  );
}
