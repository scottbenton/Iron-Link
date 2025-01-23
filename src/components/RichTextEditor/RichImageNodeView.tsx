import AlignCenter from "@mui/icons-material/FormatAlignCenter";
import AlignLeft from "@mui/icons-material/FormatAlignLeft";
import AlignRight from "@mui/icons-material/FormatAlignRight";
import SecondScreenImage from "@mui/icons-material/PresentToAll";
import AltTextIcon from "@mui/icons-material/TextSnippet";
import BreakText from "@mui/icons-material/ViewDay";
import WrapText from "@mui/icons-material/WrapText";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  Popper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Resizable } from "re-resizable";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { useSecondScreenStore } from "stores/secondScreen.store";

import { Alignment, TextWrapping } from "./RichImageNodeAttributes";

export function RichImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected, editor } = props;

  const { t } = useTranslation();
  const isReadOnly = !editor.isEditable;

  const {
    src,
    altText,
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

  const isSecondScreenFeatureActive = useSecondScreenFeature();
  const updateSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const isImageOpenOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "note_image" && store.settings.url === src,
  );
  const gameId = useGameIdOptional();

  const openImageOnSecondScreen = useCallback(() => {
    if (gameId) {
      updateSecondScreen(
        gameId,
        isImageOpenOnSecondScreen
          ? null
          : {
              type: "note_image",
              url: src,
              label: typeof altText === "string" ? altText : "",
            },
      );
    }
  }, [altText, src, gameId, updateSecondScreen, isImageOpenOnSecondScreen]);

  const [altTextDialogOpen, setAltTextDialogOpen] = useState(false);
  const [altTextName, setAltTextName] = useState(
    typeof altText === "string" ? altText : "",
  );

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
              display: "flex",
              alignItems: "center",
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
            <Tooltip
              title={t("notes.image-node.alt-text", "Add or Change Alt Text")}
            >
              <ToggleButton
                value="altTextDialog"
                selected={altTextDialogOpen}
                onClick={() => setAltTextDialogOpen(true)}
                sx={{ ml: 1 }}
                size={"small"}
              >
                <AltTextIcon />
              </ToggleButton>
            </Tooltip>
            {isSecondScreenFeatureActive && (
              <Tooltip
                title={t(
                  "notes.image-node.open-on-second-screen",
                  "Open on Second Screen",
                )}
              >
                <ToggleButton
                  value="check"
                  selected={isImageOpenOnSecondScreen}
                  onClick={openImageOnSecondScreen}
                  sx={{ ml: 1 }}
                  size={"small"}
                >
                  <SecondScreenImage />
                </ToggleButton>
              </Tooltip>
            )}
          </Card>
        </Popper>
        <Dialog
          open={altTextDialogOpen}
          onClose={() => setAltTextDialogOpen(false)}
        >
          <DialogTitleWithCloseButton
            onClose={() => setAltTextDialogOpen(false)}
          >
            {t("notes.image-node.alt-text", "Alt Text")}
          </DialogTitleWithCloseButton>
          <DialogContent>
            <Typography color="textSecondary">
              {t(
                "notes.image-node.alt-text-description",
                'Alt text is used for screen readers and search engines to better understand the content of your image. For example, "A burly woman with a longsword and tattoos", or "An androgynous scoundrel with a laser pistol"',
              )}
            </Typography>
            <TextField
              label={t("notes.image-node.alt-text", "Alt Text")}
              value={altTextName}
              onChange={(e) => setAltTextName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAltTextDialogOpen(false)} color="inherit">
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                setAltTextDialogOpen(false);
                updateAttributes({
                  altText: altTextName,
                });
              }}
              color="primary"
            >
              {t("common.save", "Save")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NodeViewWrapper>
  );
}
