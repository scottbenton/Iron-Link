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
import { DialogExtrasContext } from "components/Layout/dialogExtrasContext";

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
 * button, and Clear all. Opened from the roll stack's handle.
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
  const { dismiss, clearAll, getDismissButtonRef } = useRollDismissFocus(
    rolls,
    focusEmptyMessage,
  );

  const newestFirst = [...rolls].reverse();

  return (
    <>
      {open && <RecentRollsHost />}
      <Dialog
        open={open}
        onClose={onClose}
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
            <Button color={"inherit"} onClick={clearAll}>
              {t("datasworn.roll-card.clear-all", "Clear all")}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
