import OraclesIcon from "@mui/icons-material/Casino";
import NotesIcon from "@mui/icons-material/Description";
import OverviewIcon from "@mui/icons-material/Groups";
import LogIcon from "@mui/icons-material/History";
import MovesIcon from "@mui/icons-material/MenuBook";
import SheetIcon from "@mui/icons-material/Person";
import { Badge, Box, SvgIconProps } from "@mui/material";
import { ComponentType } from "react";
import { useTranslation } from "react-i18next";

import { NavRailItemView } from "components/Layout/NavRailItemView";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useSettledKeyboardInset } from "hooks/useKeyboardInset";

import { useAppState } from "stores/appState.store";

import { GameType } from "repositories/game.repository";

import { MobileTabs } from "./MobileTabs";
import {
  GAME_BOTTOM_NAV_HEIGHT,
  GAME_BOTTOM_NAV_ITEMS,
  GameBottomNavItem,
  getActiveGameBottomNavItem,
  getGameBottomNavItemId,
  getGameBottomNavTarget,
} from "./gameBottomNavItems";

// Hides text but leaves it to screen readers, on an inline element.
const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const;

export interface GameBottomNavProps {
  mobileTab: MobileTabs;
  setMobileTab: (tab: MobileTabs) => void;
  isOnOverviewPage: boolean;
}

// The phone layout's sections, fixed to the bottom of the window: the sheet
// (or the game's overview), Notes, and the Reference panel's Moves, Oracles
// and Log. Hidden while the on-screen keyboard is up, so it never sits
// between the keyboard and what is being typed.
export function GameBottomNav(props: GameBottomNavProps) {
  const { mobileTab, setMobileTab, isOnOverviewPage } = props;
  const { t } = useTranslation();

  const referenceTab = useAppState((state) => state.currentReferenceTab);
  const setReferenceTab = useAppState((state) => state.setCurrentReferenceTab);
  const gameLogNotificationCount = useAppState(
    (state) => state.gameLogNotificationCount,
  );
  const { gameType } = useGamePermissions();

  const isKeyboardOpen = useSettledKeyboardInset() > 0;

  const activeItem = getActiveGameBottomNavItem(mobileTab, referenceTab);
  const unreadLogCount =
    gameType !== GameType.Solo ? gameLogNotificationCount : 0;

  const labels: Record<GameBottomNavItem, string> = {
    [GameBottomNavItem.Sheet]: isOnOverviewPage
      ? t("game.overview", "Overview")
      : t("game.bottom-nav.sheet", "Sheet"),
    [GameBottomNavItem.Notes]: t("game.notes", "Notes"),
    [GameBottomNavItem.Moves]: t("character.reference-sidebar-moves", "Moves"),
    [GameBottomNavItem.Oracles]: t(
      "character.reference-sidebar-oracles",
      "Oracles",
    ),
    [GameBottomNavItem.Log]: t("game.bottom-nav.log", "Log"),
  };
  const icons: Record<GameBottomNavItem, ComponentType<SvgIconProps>> = {
    [GameBottomNavItem.Sheet]: isOnOverviewPage ? OverviewIcon : SheetIcon,
    [GameBottomNavItem.Notes]: NotesIcon,
    [GameBottomNavItem.Moves]: MovesIcon,
    [GameBottomNavItem.Oracles]: OraclesIcon,
    [GameBottomNavItem.Log]: LogIcon,
  };

  const handleSelect = (item: GameBottomNavItem) => {
    const { mobileTab: nextMobileTab, referenceTab: nextReferenceTab } =
      getGameBottomNavTarget(item);
    if (nextReferenceTab) {
      setReferenceTab(nextReferenceTab);
    }
    setMobileTab(nextMobileTab);
  };

  return (
    <Box
      component={"nav"}
      aria-label={t("game.bottom-nav.label", "Game sections")}
      hidden={isKeyboardOpen}
      sx={(theme) => ({
        display: isKeyboardOpen ? "none" : "block",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        // Under the notes toolbar that rides on the keyboard.
        zIndex: theme.zIndex.appBar - 2,
        // The nav rail's surface, so its items look the same here.
        bgcolor: "grey.900",
        color: "common.white",
        pb: "env(safe-area-inset-bottom, 0px)",
      })}
    >
      <Box
        component={"ul"}
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          height: GAME_BOTTOM_NAV_HEIGHT,
          display: "grid",
          gridTemplateColumns: `repeat(${GAME_BOTTOM_NAV_ITEMS.length}, minmax(0, 1fr))`,
        }}
      >
        {GAME_BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item === activeItem;
          const Icon = icons[item];
          const badgeCount =
            item === GameBottomNavItem.Log && !isActive ? unreadLogCount : 0;

          return (
            <Box component={"li"} key={item} display={"flex"} minWidth={0}>
              <NavRailItemView
                component={"button"}
                type={"button"}
                id={getGameBottomNavItemId(item)}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleSelect(item)}
                isSelected={isActive}
                icon={
                  <Badge
                    badgeContent={badgeCount}
                    invisible={badgeCount === 0}
                    color={"primary"}
                    max={99}
                  >
                    <Icon />
                  </Badge>
                }
                label={
                  <>
                    {labels[item]}
                    {badgeCount > 0 && (
                      <Box component={"span"} sx={visuallyHidden}>
                        {" "}
                        {t("game.bottom-nav.unread", "{{count}} unread", {
                          count: badgeCount,
                        })}
                      </Box>
                    )}
                  </>
                }
                sx={{
                  // Fills its cell, so the whole cell is the touch target.
                  flex: 1,
                  minWidth: 0,
                  justifyContent: "center",
                  gap: 0.25,
                  // A plain button, so focus shows as it does on the rail's
                  // links.
                  m: 0,
                  p: 0,
                  border: 0,
                  background: "none",
                  font: "inherit",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
