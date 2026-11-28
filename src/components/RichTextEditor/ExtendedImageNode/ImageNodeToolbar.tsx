import { useTranslation } from "react-i18next";

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "ui/components/Toolbar";
import {
  MonitorArrowUpIcon,
  NoteIcon,
  RowsIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextIndentIcon,
} from "ui/icons";

import { Alignment, TextWrapping } from "./RichImageNodeAttributes";

export interface ImageNodeToolbarProps {
  alignment: Alignment;
  textWrapping: TextWrapping;
  onAlignmentChange: (alignment: Alignment) => void;
  onTextWrappingChange: (textWrapping: TextWrapping) => void;
  onEditAltText: () => void;
  secondScreen?: { isOpen: boolean; toggle: () => void };
}

/**
 * A selected image's controls, under the image and lined up with it. They
 * follow the image in the document, so Tab reaches them right after it.
 */
export function ImageNodeToolbar(props: ImageNodeToolbarProps) {
  const {
    alignment,
    textWrapping,
    onAlignmentChange,
    onTextWrappingChange,
    onEditAltText,
    secondScreen,
  } = props;
  const { t } = useTranslation();

  return (
    <Toolbar
      variant="plain"
      aria-label={t("notes.image-node.toolbar", "Image")}
      data-alignment={alignment}
      css={{
        position: "absolute",
        top: "calc(100% + 4px)",
        zIndex: 2,
        flexWrap: "nowrap",
        width: "max-content",
        padding: "1",
        borderRadius: "md",
        border: "1px solid token(colors.border.control)",
        background: "bg.surface",
        boxShadow: "popover",
        "&[data-alignment=left]": { left: "-2px" },
        "&[data-alignment=center]": { left: "50%", translate: "-50% 0" },
        "&[data-alignment=right]": { right: "-2px" },
      }}
    >
      <ToolbarGroup
        aria-label={t("notes.image-node.alignment.label", "Alignment")}
      >
        <ToolbarButton
          label={t("notes.image-node.alignment.left", "Align Left")}
          icon={<TextAlignLeftIcon />}
          pressed={alignment === Alignment.Left}
          onClick={() => onAlignmentChange(Alignment.Left)}
        />
        <ToolbarButton
          label={t("notes.image-node.alignment.center", "Align Center")}
          icon={<TextAlignCenterIcon />}
          pressed={alignment === Alignment.Center}
          onClick={() => onAlignmentChange(Alignment.Center)}
        />
        <ToolbarButton
          label={t("notes.image-node.alignment.right", "Align Right")}
          icon={<TextAlignRightIcon />}
          pressed={alignment === Alignment.Right}
          onClick={() => onAlignmentChange(Alignment.Right)}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup
        aria-label={t("notes.image-node.text-wrapping.label", "Text wrapping")}
      >
        <ToolbarButton
          label={t("notes.image-node.text-wrapping.wrap-text", "Wrap Text")}
          icon={<TextIndentIcon />}
          pressed={textWrapping === TextWrapping.WrapText}
          onClick={() => onTextWrappingChange(TextWrapping.WrapText)}
        />
        <ToolbarButton
          label={t("notes.image-node.text-wrapping.break-text", "Break Text")}
          icon={<RowsIcon />}
          pressed={textWrapping === TextWrapping.BreakText}
          onClick={() => onTextWrappingChange(TextWrapping.BreakText)}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton
        label={t("notes.image-node.change-alt-text", "Add or Change Alt Text")}
        icon={<NoteIcon />}
        onClick={onEditAltText}
      />
      {secondScreen && (
        <ToolbarButton
          label={t(
            "notes.image-node.open-on-second-screen",
            "Open on Second Screen",
          )}
          icon={<MonitorArrowUpIcon />}
          pressed={secondScreen.isOpen}
          onClick={secondScreen.toggle}
        />
      )}
    </Toolbar>
  );
}
