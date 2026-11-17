import GameLogIcon from "@mui/icons-material/History";
import RecentRollsIcon from "@mui/icons-material/Layers";
import { Box, Button, Theme } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { NormalRollActions } from "pages/games/characterSheet/components/GameLog/NormalRollActions";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import {
  ReferenceTabs,
  getReferenceTabId,
  useAppState,
  useIsActiveRollCardHost,
  useIsGameLogVisible,
} from "stores/appState.store";

import { ExpandableRollStack } from "./ExpandableRollStack";
import { NewRollRing } from "./NewRollRing";
import { RecentRollsDialog } from "./RecentRollsDialog";
import { RollSnackbar } from "./RollSnackbar";
import { usePublishRollDockHeight } from "./usePublishRollDockHeight";
import { useRollDismissFocus } from "./useRollDismissFocus";
import {
  ROLL_DOCK_WIDE_INSET,
  ROLL_DOCK_WIDE_WIDTH,
  useRollDockPosition,
} from "./useRollDockPosition";

// How many older cards peek out behind the newest one on phones.
const MAX_PEEKING_CARDS = 2;
// How far each older card's edge shows above the one in front of it.
const PEEK_OFFSET = 6;

// The dark buttons beside the stack: the phone handle and Visit the log.
const stackButtonSx: SystemStyleObject<Theme> = {
  pointerEvents: "all",
  bgcolor: "grey.800",
  color: "common.white",
  "&:hover": { bgcolor: "grey.700" },
  [TOUCH_DEVICE_MEDIA_QUERY]: { minHeight: TOUCH_TARGET_SIZE },
};

/**
 * The recent rolls as a stack: the newest card in full, with the edges of up
 * to two older ones peeking out behind it. On phones a handle opens every
 * recent roll in a dialog; wider screens expand the stack on hover or focus
 * (`ExpandableRollStack`) and offer Visit the log instead. The page shows
 * it, and so does each open dialog (through `DialogExtrasContext`), since a
 * modal dialog hides the page from screen readers; only the newest place
 * shows it.
 */
export interface RollSnackbarSectionProps {
  // The page's own section, which shows the cards while no dialog is open.
  isPage?: boolean;
}

export function RollSnackbarSection(props: RollSnackbarSectionProps) {
  const { isPage } = props;
  const { t } = useTranslation();
  const rolls = useAppState((state) => state.visibleRolls);

  const isActive = useIsActiveRollCardHost(isPage);
  const gameId = useGameIdOptional();
  const { isMobile, bottom } = useRollDockPosition();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // The snackbars sit above the stack, which says how tall it is.
  const [dockElement, setDockElement] = useState<HTMLElement | null>(null);
  usePublishRollDockHeight(dockElement, isActive);

  const { dismiss, getDismissButtonRef } = useRollDismissFocus(rolls);

  const setReferenceTab = useAppState((state) => state.setCurrentReferenceTab);
  const isGameLogVisible = useIsGameLogVisible();
  // Wide screens show the Reference panel beside the sheet in a game; a
  // dialog would cover it.
  const canVisitLog = !!isPage && !isMobile && !!gameId && !isGameLogVisible;
  const visitLog = () => {
    setReferenceTab(ReferenceTabs.GameLog);
    document.getElementById(getReferenceTabId(ReferenceTabs.GameLog))?.focus();
  };

  const isShown = isActive && rolls.length > 0;

  const newest = rolls[rolls.length - 1];
  const peekingCount = Math.min(rolls.length - 1, MAX_PEEKING_CARDS);

  // A roll that was not here before gets the gradient ring once. A card
  // uncovered by a dismiss, or shown when this place opens, does not.
  const seenRollIds = useRef<Set<string> | null>(null);
  const [flashRollId, setFlashRollId] = useState<string | null>(null);
  useEffect(() => {
    const ids = new Set(rolls.map(({ roll }) => roll.id));
    const previous = seenRollIds.current;
    seenRollIds.current = ids;
    if (previous && newest && !previous.has(newest.roll.id)) {
      setFlashRollId(newest.roll.id);
    }
  }, [rolls, newest]);

  return (
    <>
      <Box
        ref={setDockElement}
        // A landmark only while there are rolls to find in it.
        component={rolls.length > 0 ? "section" : "div"}
        aria-label={
          rolls.length > 0
            ? t("datasworn.roll-card.recent-rolls", "Recent rolls")
            : undefined
        }
        data-testid={"roll-dock"}
        position={"fixed"}
        zIndex={10000}
        display={isShown ? "flex" : "none"}
        flexDirection={"column"}
        alignItems={"flex-end"}
        sx={(theme) => ({
          bottom,
          ...(isMobile
            ? { left: theme.spacing(2), right: theme.spacing(2) }
            : {
                right: ROLL_DOCK_WIDE_INSET,
                width: ROLL_DOCK_WIDE_WIDTH,
                maxWidth: `calc(100vw - ${2 * ROLL_DOCK_WIDE_INSET}px)`,
              }),
          transition: theme.transitions.create("bottom"),
          pointerEvents: "none",
        })}
      >
        {isMobile && rolls.length > 1 && (
          <Button
            variant={"contained"}
            size={"small"}
            aria-haspopup={"dialog"}
            startIcon={<RecentRollsIcon />}
            onClick={() => setIsDialogOpen(true)}
            sx={[
              stackButtonSx,
              // Clear of the older cards' edges.
              { mb: `${PEEK_OFFSET * peekingCount + 4}px` },
            ]}
          >
            {t("datasworn.roll-card.roll-count", "{{count}} rolls", {
              count: rolls.length,
            })}
          </Button>
        )}
        {isMobile && newest && (
          <Box
            position={"relative"}
            width={"100%"}
            sx={{ pointerEvents: "all" }}
          >
            {/* The older cards' edges: drawn only, with nothing to read. */}
            {Array.from({ length: peekingCount }, (_, index) => {
              const depth = index + 1;
              return (
                <Box
                  key={depth}
                  aria-hidden
                  data-testid={"roll-stack-peek"}
                  sx={(theme) => ({
                    position: "absolute",
                    top: -PEEK_OFFSET * depth,
                    bottom: PEEK_OFFSET * depth,
                    left: 8 * depth,
                    right: 8 * depth,
                    zIndex: -depth,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: depth === 1 ? "grey.700" : "grey.600",
                    boxShadow: theme.shadows[2],
                  })}
                />
              );
            })}
            {flashRollId === newest.roll.id && (
              <NewRollRing key={`ring-${flashRollId}`} />
            )}
            <RollSnackbar
              key={newest.roll.id}
              roll={newest.roll}
              rollId={newest.id}
              isExpanded
              clampContent
              cardSx={{ width: "100%" }}
              onDismiss={() => dismiss(newest.roll.id)}
              dismissButtonRef={getDismissButtonRef(newest.roll.id)}
              actions={
                gameId &&
                newest.id && (
                  <NormalRollActions rollId={newest.id} roll={newest.roll} />
                )
              }
            />
          </Box>
        )}
        {/* Unmounted while hidden, so it opens collapsed when shown again. */}
        {!isMobile && isShown && (
          <ExpandableRollStack
            rolls={rolls}
            flashRollId={flashRollId}
            onDismiss={dismiss}
            getDismissButtonRef={getDismissButtonRef}
          />
        )}
        {canVisitLog && rolls.length > 0 && (
          // Below the stack, so it stays put while the stack expands upward.
          <Box pt={1} sx={{ pointerEvents: "all" }}>
            <Button
              variant={"contained"}
              size={"small"}
              startIcon={<GameLogIcon />}
              onClick={visitLog}
              sx={stackButtonSx}
            >
              {t("datasworn.roll-card.visit-log", "Visit the log")}
            </Button>
          </Box>
        )}
      </Box>
      {/* Outside the dock, which changes element as rolls come and go. */}
      <RecentRollsDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
