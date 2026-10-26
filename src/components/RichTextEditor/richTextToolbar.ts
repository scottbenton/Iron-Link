import type { Editor as TTEditor } from "@tiptap/react";

// What the toolbar can do with a Guide's secrets. Absent for anyone else.
export interface SecretsToolbarState {
  // The caret is in a secret block, which the toolbar's editor now is.
  inSecret: boolean;
  canInsert: boolean;
  insertSecret: () => void;
  // Selected text in the note that can be moved into a new block.
  canMakeSecret: boolean;
  makeSecret: () => void;
  // Stores an image for a block and resolves the src to give its node.
  uploadImage: (file: File) => Promise<string>;
}

export interface RichTextToolbarProps {
  editor: TTEditor;
  secrets?: SecretsToolbarState;
}
