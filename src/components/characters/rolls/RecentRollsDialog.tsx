import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { MAIN_CONTENT_ID } from "components/Layout/SkipToContentButton";
import { DialogExtrasContext } from "components/Layout/dialogExtrasContext";
import { focusPageStart } from "components/Layout/useFocusPageOnNavigate";

import { NormalRollActions } from "pages/games/characterSheet/components/GameLog/NormalRollActions";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useIsMobile } from "hooks/useIsMobile";

import { useAppState, useIsActiveRollCardHost } from "stores/appState.store";

import { RollSnackbar } from "./RollSnackbar";
import { useRollDismissFocus } from "./useRollDismissFocus";

export interface RecentRollsDialogProps {
  open: boolean;
  onClose: () => void;
}

// Takes the roll cards over from whatever is behind the dialog, which lists
// them itself; rendered only while the dialog is open, so the stack is back
// before focus returns to its handle.
function RecentRollsHost() {
  useIsActiveRollCardHost();
  return null;
}

/**
 * Every recent roll, newest first, each with its actions and its own dismiss
 * button, and Clear all, which also closes it. Opened from the roll stack's
 * handle.
 */
export function RecentRollsDialog(props: RecentRollsDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const rolls = useAppState((state) => state.visibleRolls);
  const gameId = useGameIdOptional();

  // With every roll gone, focus moves to the message saying so rather than
  // being lost with the last button.
  const emptyMessageRef = useRef<HTMLParagraphElement>(null);
  const focusEmptyMessage = () => emptyMessageRef.current?.focus();
  const { dismiss, getDismissButtonRef } = useRollDismissFocus(
    rolls,
    focusEmptyMessage,
  );

  // Clear all leaves nothing to show, so it closes the dialog too. The dialog
  // returns focus to what opened it; when that went with the rolls (the
  // stack's handle does), focus moves to the start of the page instead.
  const clearAllRolls = useAppState((state) => state.clearAllRolls);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasCleared = useRef(false);
  const clearAllAndClose = () => {
    wasCleared.current = true;
    clearAllRolls();
    onClose();
  };
  const handleExited = () => {
    if (!wasCleared.current) return;
    wasCleared.current = false;
    const active = document.activeElement;
    const isFocusLost =
      !active ||
      active === document.body ||
      !!dialogRef.current?.contains(active);
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (isFocusLost && main) focusPageStart(main);
  };

  const newestFirst = [...rolls].reverse();

  return (
    <>
      {open && <RecentRollsHost />}
      <Dialog
        ref={dialogRef}
        open={open}
        onClose={onClose}
        slotProps={{ transition: { onExited: handleExited } }}
        fullScreen={isMobile}
        fullWidth
        maxWidth={"xs"}
      >
        {/* The dialog lists the rolls itself, so it shows no roll stack. */}
        <DialogExtrasContext.Provider value={null}>
          <DialogTitleWithCloseButton onClose={onClose}>
            {t("datasworn.roll-card.recent-rolls", "Recent rolls")}
          </DialogTitleWithCloseButton>
        </DialogExtrasContext.Provider>
        <DialogContent>
          {newestFirst.length > 0 ? (
            <Box
              component={"ul"}
              sx={{
                listStyle: "none",
                m: 0,
                p: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {newestFirst.map(({ id, roll }) => (
                <li key={roll.id}>
                  <RollSnackbar
                    roll={roll}
                    rollId={id}
                    isExpanded
                    onDismiss={() => dismiss(roll.id)}
                    dismissButtonRef={getDismissButtonRef(roll.id)}
                    actions={
                      gameId &&
                      id && <NormalRollActions rollId={id} roll={roll} />
                    }
                    cardSx={{ width: "100%" }}
                  />
                </li>
              ))}
            </Box>
          ) : (
            <Typography
              ref={emptyMessageRef}
              tabIndex={-1}
              color={"text.secondary"}
              sx={{ outline: "none" }}
            >
              {t("datasworn.roll-card.no-recent-rolls", "No recent rolls")}
            </Typography>
          )}
        </DialogContent>
        {newestFirst.length > 0 && (
          <DialogActions>
            <Button color={"inherit"} onClick={clearAllAndClose}>
              {t("datasworn.roll-card.clear-all", "Clear all")}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
