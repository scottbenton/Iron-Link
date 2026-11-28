import type { Editor } from "@tiptap/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
} from "ui/components/Menu";
import { ToolbarMenuButton } from "ui/components/Toolbar";
import { TextAaIcon } from "ui/icons";

import {
  TEXT_TYPES,
  type TextType,
  getActiveTextType,
  getTextTypeLabel,
  setTextType,
} from "./textTypes";

export interface TextTypeMenuProps {
  editor: Editor;
  /** Just the icon, for the phone's keyboard bar. */
  compact?: boolean;
}

/**
 * Picks the block type at the caret: text or a heading. The button shows
 * the current type, and its name says it too.
 */
export function TextTypeMenu(props: TextTypeMenuProps) {
  const { editor, compact } = props;
  const { t } = useTranslation();

  // The toolbar re-renders on every transaction, so this follows the caret.
  const current = getActiveTextType(editor);
  const currentLabel = getTextTypeLabel(t, current);
  const name = t("notes.text-type.label-with-value", "Text type: {{type}}", {
    type: currentLabel,
  });

  // Where focus goes as the menu closes: the note once a type is chosen,
  // so the caret (and a phone's keyboard) stays put; otherwise the button.
  const button = useRef<HTMLButtonElement>(null);
  const finalFocus = useRef<HTMLElement | null>(null);

  return (
    <Menu
      onOpenChange={(open) => {
        if (open) finalFocus.current = button.current;
      }}
    >
      <ToolbarMenuButton
        ref={button}
        label={compact ? name : currentLabel}
        aria-label={name}
        icon={<TextAaIcon />}
        showLabel={!compact}
      />
      <MenuContent finalFocus={finalFocus}>
        <MenuRadioGroup
          value={current}
          onValueChange={(value) => {
            finalFocus.current = editor.view.dom;
            setTextType(editor, value as TextType);
          }}
        >
          {TEXT_TYPES.map((type) => (
            <MenuRadioItem key={type} value={type} closeOnClick>
              {getTextTypeLabel(t, type)}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
