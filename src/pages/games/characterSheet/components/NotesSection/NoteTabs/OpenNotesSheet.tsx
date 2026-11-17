import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import NoteIcon from "@mui/icons-material/DescriptionOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import WorldIcon from "@mui/icons-material/PublicOutlined";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  Divider,
  IconButton,
  Slide,
  Typography,
} from "@mui/material";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import type { IOpenNoteItemType } from "stores/notes.store";

const ROW_MIN_HEIGHT = 56;
// Focus goes to the sheet's heading once no row is left to take it.
const FOCUS_HEADING = Symbol("heading");

export interface OpenNotesSheetTab {
  id: string;
  label: string;
  type: IOpenNoteItemType;
}

export interface OpenNotesSheetProps {
  open: boolean;
  onClose: () => void;
  // Called once the sheet has finished closing.
  onExited?: () => void;
  tabs: OpenNotesSheetTab[];
  currentTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  // Left out where the person has no notes folder of their own.
  onNewNote?: () => void;
  onAllNotes?: () => void;
}

const TYPE_ICONS: Record<IOpenNoteItemType, typeof NoteIcon> = {
  note: NoteIcon,
  folder: FolderIcon,
  world: WorldIcon,
};

// The phone's list of open notes, which stands in for the Notes tab strip
// the way a phone browser lists its tabs: a sheet from the bottom of the
// window with a row for each open note, folder or world page, each with its
// own Close button beside it, plus New note and All notes.
export function OpenNotesSheet(props: OpenNotesSheetProps) {
  const {
    open,
    onClose,
    onExited,
    tabs,
    currentTabId,
    onSelectTab,
    onCloseTab,
    onNewNote,
    onAllNotes,
  } = props;
  const { t } = useTranslation();

  const titleId = useId();
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());

  // Closing a row moves focus to the row that takes its place, or the one
  // before it, or the heading once none is left.
  const [focusTarget, setFocusTarget] = useState<
    string | typeof FOCUS_HEADING | null
  >(null);
  useEffect(() => {
    if (focusTarget === null) return;
    if (focusTarget === FOCUS_HEADING) {
      const heading = document.getElementById(titleId);
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    } else {
      rowButtons.current.get(focusTarget)?.focus();
    }
    setFocusTarget(null);
  }, [focusTarget, titleId, tabs]);

  const handleCloseTab = (tabId: string) => {
    const index = tabs.findIndex((tab) => tab.id === tabId);
    const next = tabs[index + 1] ?? tabs[index - 1];
    onCloseTab(tabId);
    setFocusTarget(next?.id ?? FOCUS_HEADING);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby={titleId}
      slots={{ transition: Slide }}
      slotProps={{
        transition: { direction: "up", onExited },
        container: { sx: { alignItems: "flex-end" } },
        paper: {
          sx: (theme) => ({
            m: 0,
            width: "100%",
            maxWidth: "100%",
            maxHeight: "85%",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: theme.shape.borderRadius * 2,
            borderTopRightRadius: theme.shape.borderRadius * 2,
            pb: "env(safe-area-inset-bottom, 0px)",
          }),
        },
      }}
    >
      <DialogTitleWithCloseButton
        onClose={onClose}
        actions={
          onNewNote && (
            <Button
              variant={"outlined"}
              startIcon={<AddIcon />}
              onClick={onNewNote}
              sx={{
                mr: 0.5,
                whiteSpace: "nowrap",
                [TOUCH_DEVICE_MEDIA_QUERY]: { minHeight: TOUCH_TARGET_SIZE },
              }}
            >
              {t("notes.open-notes.new-note", "New note")}
            </Button>
          )
        }
      >
        {t("notes.open-notes.title", "Open notes")}
      </DialogTitleWithCloseButton>
      <Box
        component={"ul"}
        sx={{
          listStyle: "none",
          m: 0,
          px: 1.5,
          pt: 0,
          pb: onAllNotes ? 0 : 2,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {tabs.map((tab) => {
          const isCurrent = tab.id === currentTabId;
          const Icon = TYPE_ICONS[tab.type];
          return (
            <Box
              component={"li"}
              key={tab.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                borderRadius: 1,
                bgcolor: isCurrent ? "action.selected" : undefined,
              }}
            >
              <ButtonBase
                ref={(element: HTMLButtonElement | null) => {
                  if (element) rowButtons.current.set(tab.id, element);
                  else rowButtons.current.delete(tab.id);
                }}
                // Opening the sheet puts focus on the note that is open.
                autoFocus={isCurrent}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onSelectTab(tab.id)}
                sx={(theme) => ({
                  flexGrow: 1,
                  minWidth: 0,
                  minHeight: ROW_MIN_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1.5,
                  px: 1,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  textAlign: "left",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-focusVisible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2,
                  },
                })}
              >
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon fontSize={"small"} />
                </Box>
                <Typography
                  component={"span"}
                  noWrap
                  sx={{ fontWeight: isCurrent ? 600 : 500, minWidth: 0 }}
                >
                  {tab.label}
                </Typography>
              </ButtonBase>
              <IconButton
                aria-label={t("notes.tabs.close-tab", "Close {{name}}", {
                  name: tab.label,
                })}
                onClick={() => handleCloseTab(tab.id)}
                sx={{
                  flexShrink: 0,
                  [TOUCH_DEVICE_MEDIA_QUERY]: {
                    width: TOUCH_TARGET_SIZE,
                    height: TOUCH_TARGET_SIZE,
                  },
                }}
              >
                <CloseIcon fontSize={"small"} />
              </IconButton>
            </Box>
          );
        })}
        {tabs.length === 0 && (
          <Box
            component={"li"}
            sx={{ px: 1, py: 2.5, color: "text.secondary" }}
          >
            {t("notes.open-notes.empty", "No open notes")}
          </Box>
        )}
      </Box>
      {onAllNotes && (
        <>
          <Divider sx={{ mt: 1 }} />
          <Box px={1.5} pt={0.75} pb={2}>
            <Button
              color={"inherit"}
              startIcon={<FolderIcon />}
              onClick={onAllNotes}
              fullWidth
              sx={{
                justifyContent: "flex-start",
                minHeight: 48,
                px: 1,
              }}
            >
              {t("notes.open-notes.all-notes", "All notes")}
            </Button>
          </Box>
        </>
      )}
    </Dialog>
  );
}
