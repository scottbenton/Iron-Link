import type { Editor } from "@tiptap/react";
import type { TFunction } from "i18next";

/** The block types the text type menu offers, in its order. */
export const TEXT_TYPES = ["p", "h1", "h2", "h3", "h4", "h5"] as const;
export type TextType = (typeof TEXT_TYPES)[number];

const HEADING_LEVELS = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
} as const satisfies Record<Exclude<TextType, "p">, number>;

export function getTextTypeLabel(t: TFunction, type: TextType): string {
  switch (type) {
    case "h1":
      return t("notes.text-type.heading-1", "Heading 1");
    case "h2":
      return t("notes.text-type.heading-2", "Heading 2");
    case "h3":
      return t("notes.text-type.heading-3", "Heading 3");
    case "h4":
      return t("notes.text-type.heading-4", "Heading 4");
    case "h5":
      return t("notes.text-type.heading-5", "Heading 5");
    case "p":
      return t("notes.text-type.normal-text", "Normal Text");
  }
}

/** The block type at the caret; anything that isn't a heading is text. */
export function getActiveTextType(editor: Editor): TextType {
  for (const [type, level] of Object.entries(HEADING_LEVELS)) {
    if (editor.isActive("heading", { level })) return type as TextType;
  }
  return "p";
}

/** Turns the blocks at the caret into `type`. */
export function setTextType(editor: Editor, type: TextType) {
  if (type === "p") {
    editor.chain().focus().setParagraph().run();
    return;
  }
  editor
    .chain()
    .focus()
    .setHeading({ level: HEADING_LEVELS[type] })
    .run();
}
