import Mention from "@tiptap/extension-mention";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { i18n } from "i18n/config";

import { NoteMention } from "./NoteMention";
import { mentionSuggestionOptions } from "./otherNoteOptions";

// Notes store their title in the mention, as they always have. World entries
// store only their id: their name is read live wherever the mention is shown
// or copied, and a reader who cannot see the entry never gets the name.
function getMentionText(node: ProseMirrorNode): string {
  if (node.attrs.kind === "worldEntry") {
    const entry =
      useWorldEntriesStore.getState().entryState.entries[node.attrs.id];
    return `@${
      entry?.name ?? i18n.t("worlds.mentions.unavailable", "Unavailable entry")
    }`;
  }
  return `@${node.attrs.label ?? node.attrs.id}`;
}

export const NoteMentionExtension = Mention.configure({
  suggestion: mentionSuggestionOptions,
  renderText: ({ node }) => getMentionText(node),
  renderHTML: ({ options, node }) => [
    "span",
    options.HTMLAttributes,
    getMentionText(node),
  ],
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-kind") ?? "note",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(NoteMention);
  },
});
