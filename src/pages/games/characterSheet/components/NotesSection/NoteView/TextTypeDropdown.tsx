import { MenuItem, SxProps, TextField } from "@mui/material";
import { Editor } from "@tiptap/react";
import { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";

export interface TextTypeDropdownProps {
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

export const TextTypeDropdown: React.FC<TextTypeDropdownProps> = (props) => {
  const { editor, sx } = props;

  const getActiveTextType = () => {
    if (editor.isActive("heading", { level: 1 })) return TEXT_TYPES.heading1;
    if (editor.isActive("heading", { level: 2 })) return TEXT_TYPES.heading2;
    if (editor.isActive("heading", { level: 3 })) return TEXT_TYPES.heading3;
    if (editor.isActive("heading", { level: 4 })) return TEXT_TYPES.heading4;
    if (editor.isActive("heading", { level: 5 })) return TEXT_TYPES.heading5;

    return TEXT_TYPES.paragraph;
  };

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

  return (
    <>
      <TextField
        value={getActiveTextType()}
        select
        hiddenLabel
        aria-label={"Text Type"}
        onChange={(evt) => setActiveTextType(evt.target.value as TEXT_TYPES)}
        variant={"standard"}
        margin={"none"}
        sx={[
          { minWidth: "140px", width: "140px", mr: 1 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        // size={"small"}
      >
        {Object.keys(textLabels).map((key, index) => (
          <MenuItem key={index} value={key}>
            {textLabels[key as keyof typeof textLabels]}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
};
