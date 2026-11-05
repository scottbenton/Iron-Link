import ClearIcon from "@mui/icons-material/Close";
import { Box, Fab, Slide } from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TransitionGroup } from "react-transition-group";

import { NormalRollActions } from "pages/games/characterSheet/components/GameLog/NormalRollActions";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import {
  useAppState,
  useIsActiveRollCardHost,
  useSetAnnouncement,
} from "stores/appState.store";

import { RollSnackbar } from "./RollSnackbar";

/**
 * The cards of the last few rolls. The page shows them, and so does each
 * open dialog (through `DialogExtrasContext`), since a modal dialog hides the
 * page from screen readers; only the newest place shows them.
 */
export interface RollSnackbarSectionProps {
  // The page's own section, which shows the cards while no dialog is open.
  isPage?: boolean;
}

export function RollSnackbarSection(props: RollSnackbarSectionProps) {
  const { isPage } = props;
  const { t } = useTranslation();
  const rolls = useAppState((state) => state.visibleRolls);
  const clearRoll = useAppState((state) => state.clearRoll);
  const clearRolls = useAppState((state) => state.clearAllRolls);
  const announce = useSetAnnouncement();

  const isActive = useIsActiveRollCardHost(isPage);
  const gameId = useGameIdOptional();

  // Dismissing a card removes the button that had focus, so focus moves to
  // the next card's dismiss button (or the one before it) instead of being
  // lost.
  const dismissButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusKey = useRef<string | null>(null);
  useEffect(() => {
    const key = pendingFocusKey.current;
    if (key) {
      pendingFocusKey.current = null;
      dismissButtons.current.get(key)?.focus();
    }
  }, [rolls]);

  // Read the rolls as they are now: a card sliding out still holds the
  // handler from when it was shown.
  const handleDismiss = (rollKey: string) => {
    const current = useAppState.getState().visibleRolls;
    const index = current.findIndex(({ roll }) => roll.id === rollKey);
    if (index < 0) return;
    const next = current[index + 1] ?? current[index - 1];
    pendingFocusKey.current = next ? next.roll.id : null;
    clearRoll(index);
  };

  const handleClearAll = () => {
    clearRolls();
    announce(t("datasworn.roll-card.cleared", "Cleared recent rolls"));
  };

  return (
    <Box
      // A landmark only while there are rolls to find in it.
      component={rolls.length > 0 ? "section" : "div"}
      aria-label={
        rolls.length > 0
          ? t("datasworn.roll-card.recent-rolls", "Recent rolls")
          : undefined
      }
      position={"fixed"}
      zIndex={10000}
      bottom={(theme) => theme.spacing(2)}
      right={(theme) => theme.spacing(2)}
      ml={2}
      display={isActive ? "flex" : "none"}
      flexDirection={"column"}
      alignItems={"flex-end"}
      sx={(theme) => ({
        transition: theme.transitions.create(["bottom", "transform"]),
        pointerEvents: "none",
        "&>ul": {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          pointerEvents: "none",
          listStyle: "none",
          m: 0,
          p: 0,
        },
      })}
    >
      <TransitionGroup component={"ul"}>
        {rolls.map(({ id, roll }, index, array) => (
          <Slide direction={"left"} key={roll.id}>
            <Box component={"li"} mt={1} sx={{ pointerEvents: "all" }}>
              <RollSnackbar
                roll={roll}
                rollId={id}
                isExpanded={index === array.length - 1}
                onDismiss={() => handleDismiss(roll.id)}
                dismissButtonRef={(element: HTMLButtonElement | null) => {
                  if (element) {
                    dismissButtons.current.set(roll.id, element);
                  } else {
                    dismissButtons.current.delete(roll.id);
                  }
                }}
                actions={
                  gameId && id && <NormalRollActions rollId={id} roll={roll} />
                }
              />
            </Box>
          </Slide>
        ))}
      </TransitionGroup>
      <Slide direction={"left"} in={rolls.length > 0} unmountOnExit>
        <Fab
          variant={"extended"}
          size={"medium"}
          color={"primary"}
          onClick={handleClearAll}
          sx={{ mt: 2, pointerEvents: "all" }}
        >
          {t("datasworn.roll-card.clear-all", "Clear All")}
          <ClearIcon sx={{ ml: 1 }} />
        </Fab>
      </Slide>
    </Box>
  );
}
