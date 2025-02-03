import Mention from "@tiptap/extension-mention";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { NoteMention } from "./NoteMention";
import { mentionSuggestionOptions } from "./otherNoteOptions";

export const NoteMentionExtension = Mention.configure({
  suggestion: mentionSuggestionOptions,
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(NoteMention);
  },
});
