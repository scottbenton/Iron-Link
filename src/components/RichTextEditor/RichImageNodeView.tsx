import AlignCenter from "@mui/icons-material/FormatAlignCenter";
import AlignLeft from "@mui/icons-material/FormatAlignLeft";
import AlignRight from "@mui/icons-material/FormatAlignRight";
import BreakText from "@mui/icons-material/ViewDay";
import WrapText from "@mui/icons-material/WrapText";
import {
  Box,
  Card,
  Popper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Resizable } from "re-resizable";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Alignment, TextWrapping } from "./RichImageNodeAttributes";

export function RichImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected, editor } = props;

  const { t } = useTranslation();
  const isReadOnly = !editor.isEditable;

  const {
    src,
    textWrapping: rawTextWrapping,
    width,
    alignment: rawAlignment,
  } = node.attrs;

  const alignment: Alignment = Object.values(Alignment).includes(rawAlignment)
    ? rawAlignment
    : Alignment.Left;
  const textWrapping: TextWrapping = Object.values(TextWrapping).includes(
    rawTextWrapping,
  )
    ? rawTextWrapping
    : TextWrapping.BreakText;

  let float: "left" | "right" | undefined = undefined;
  if (textWrapping === "wrap-text") {
    switch (alignment) {
      case "left":
        float = "left";
        break;
      case "right":
        float = "right";
        break;
      default:
        float = undefined;
    }
  }

  let mr: number | "auto" | undefined = undefined;
  let ml: number | "auto" | undefined = undefined;
  if (float === "left") {
    mr = 2;
  }
  if (float === "right") {
    ml = 2;
  }
  if (alignment === "center") {
    mr = "auto";
    ml = "auto";
  }
  if (alignment === "right") {
    mr = 0;
    ml = "auto";
  }

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (isReadOnly) {
    return (
      <NodeViewWrapper>
        <Box
          sx={{
            width: width,
            maxWidth: "100%",
            objectFit: "contain",
            float,
            mr,
            ml,
            my: 1,
            borderRadius: 1,
            overflow: "hidden",
            display: "flex",
          }}
        >
          <Box component="img" src={src} aria-hidden sx={{ width: "100%" }} />
        </Box>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <Box
        component={Resizable}
        lockAspectRatio
        size={{
          width: width ?? "100%",
        }}
        minWidth={50}
        maxWidth={"100%"}
        onResizeStop={(_, __, ref) => {
          updateAttributes({
            width: ref.getBoundingClientRect().width,
          });
        }}
        sx={{
          display: "flex",
          my: 1,
          float,
          mr,
          ml,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: selected ? "primary.main" : "transparent",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box
          ref={setAnchorEl}
          component="img"
          sx={{
            width: "100%",
            objectFit: "contain",
          }}
          src={src}
          aria-hidden
        />
        <Popper
          open={selected && !isReadOnly}
          anchorEl={anchorEl}
          placement="bottom"
        >
          <Card
            elevation={4}
            sx={{
              mt: -0.5,
              p: 0.5,
            }}
          >
            <ToggleButtonGroup
              value={alignment}
              exclusive
              onChange={(_, value) => {
                updateAttributes({
                  alignment: value,
                });
              }}
              size="small"
            >
              <Tooltip
                title={t("notes.image-node.alignment.left", "Align Left")}
              >
                <ToggleButton value={Alignment.Left}>
                  <AlignLeft />
                </ToggleButton>
              </Tooltip>
              <Tooltip
                title={t("notes.image-node.alignment.center", "Align Center")}
              >
                <ToggleButton value={Alignment.Center}>
                  <AlignCenter />
                </ToggleButton>
              </Tooltip>
              <Tooltip
                title={t("notes.image-node.alignment.right", "Align Right")}
              >
                <ToggleButton value={Alignment.Right}>
                  <AlignRight />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={textWrapping}
              exclusive
              onChange={(_, value) => {
                updateAttributes({
                  textWrapping: value,
                });
              }}
              sx={{ ml: 1 }}
              size="small"
            >
              <Tooltip
                title={t(
                  "notes.image-node.text-wrapping.wrap-text",
                  "Wrap Text",
                )}
              >
                <ToggleButton value={TextWrapping.WrapText}>
                  <WrapText />
                </ToggleButton>
              </Tooltip>
              <Tooltip
                title={t(
                  "notes.image-node.text-wrapping.break-text",
                  "Break Text",
                )}
              >
                <ToggleButton value={TextWrapping.BreakText}>
                  <BreakText />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Card>
        </Popper>
      </Box>
    </NodeViewWrapper>
  );
}
