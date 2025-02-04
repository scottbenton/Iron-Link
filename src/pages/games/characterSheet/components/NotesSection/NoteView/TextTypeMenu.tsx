import TextTypeIcon from "@mui/icons-material/FormatSize";
import { IconButton, Menu, MenuItem, SxProps, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { TFunction } from "i18next";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface TextTypeMenuProps {
  editor: Editor;
  sx?: SxProps;
}

enum TEXT_TYPES {
  heading1 = "h1",
  heading2 = "h2",
  heading3 = "h3",
  heading4 = "h4",
  heading5 = "h5",
  paragraph = "p",
}

function getTextLabels(t: TFunction) {
  return {
    [TEXT_TYPES.heading1]: t("notes.text-type.heading-1", "Heading 1"),
    [TEXT_TYPES.heading2]: t("notes.text-type.heading-2", "Heading 2"),
    [TEXT_TYPES.heading3]: t("notes.text-type.heading-3", "Heading 3"),
    [TEXT_TYPES.heading4]: t("notes.text-type.heading-4", "Heading 4"),
    [TEXT_TYPES.heading5]: t("notes.text-type.heading-5", "Heading 5"),
    [TEXT_TYPES.paragraph]: t("notes.text-type.normal-text", "Normal Text"),
  };
}

export const TextTypeMenu: React.FC<TextTypeMenuProps> = (props) => {
  const { editor, sx } = props;

  const setActiveTextType = (type: TEXT_TYPES) => {
    switch (type) {
      case TEXT_TYPES.heading1:
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case TEXT_TYPES.heading2:
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case TEXT_TYPES.heading3:
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case TEXT_TYPES.heading4:
        editor.chain().focus().toggleHeading({ level: 4 }).run();
        break;
      case TEXT_TYPES.heading5:
        editor.chain().focus().toggleHeading({ level: 5 }).run();
        break;
      default:
        editor.chain().focus().setParagraph().run();
    }
  };

  const { t } = useTranslation();
  const textLabels = getTextLabels(t);

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Tooltip
        title={t("notes.text-type.change-text-type", "Change text type")}
      >
        <IconButton ref={buttonRef} onClick={() => setOpen(true)} sx={sx}>
          <TextTypeIcon />
        </IconButton>
      </Tooltip>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={buttonRef.current}
      >
        {Object.keys(textLabels).map((key, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              setActiveTextType(key as TEXT_TYPES);
              setOpen(false);
            }}
          >
            {textLabels[key as keyof typeof textLabels]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
