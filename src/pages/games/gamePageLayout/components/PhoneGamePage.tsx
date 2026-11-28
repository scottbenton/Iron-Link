import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { RecentRollsDock } from "components/characters/rolls/RecentRollsDock";
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import { VisuallyHidden } from "ui/components/VisuallyHidden";
import {
  ChatsCircleIcon,
  DiceFiveIcon,
  FileTextIcon,
  HandFistIcon,
  UserIcon,
  UsersThreeIcon,
} from "ui/icons";
import { MobileNav, MobileNavItem } from "ui/layout";
import { Box, Flex } from "ui/primitives";

import { GameLog } from "pages/games/characterSheet/components/GameLog";
import { NotesSection } from "pages/games/characterSheet/components/NotesSection";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { ReferenceTabs, useAppState } from "stores/appState.store";

import { GameType } from "repositories/game.repository";

type PhoneSection = "page" | "notes" | "moves" | "oracles" | "log";

// The reference tab each reference section stands for. The log's unread
// count is cleared while the reference tab is the Game Log, so it follows
// the bar: Moves, Oracles and Log set it, the others move it off the log.
const referenceTabs: Partial<Record<PhoneSection, ReferenceTabs>> = {
  moves: ReferenceTabs.Moves,
  oracles: ReferenceTabs.Oracles,
  log: ReferenceTabs.GameLog,
};

export interface PhoneGamePageProps {
  /** A character's page, rather than the game's overview. */
  onCharacter: boolean;
  /** Where the character or overview page is: moving to another resets. */
  pageKey: string;
  banner?: ReactNode;
}

/**
 * The game page on phones: one section at a time, the page (a character or
 * the game's overview), the notes, the moves, the oracles or the game log,
 * chosen from the bottom bar. Every section stays mounted, so an open note
 * or a scrolled list keeps its place. Second Screen, the reference column's
 * last tab elsewhere, is in the game's settings menu here.
 */
export function PhoneGamePage(props: PhoneGamePageProps) {
  const { onCharacter, pageKey, banner } = props;
  const { t } = useTranslation();
  const [section, setSection] = useState<PhoneSection>("page");

  const referenceTab = useAppState((state) => state.currentReferenceTab);
  const setReferenceTab = useAppState((state) => state.setCurrentReferenceTab);
  const unread = useAppState((state) => state.gameLogNotificationCount);
  const { gameType } = useGamePermissions();

  // Another character, or the overview, opens on its own page.
  useEffect(() => {
    setSection("page");
  }, [pageKey]);

  // The log counts as read only while it shows, so a Game Log tab kept from
  // a wider window moves to Moves once the log isn't the section on screen.
  useEffect(() => {
    if (section !== "log" && referenceTab === ReferenceTabs.GameLog) {
      setReferenceTab(ReferenceTabs.Moves);
    }
  }, [section, referenceTab, setReferenceTab]);

  const select = (id: PhoneSection) => {
    setSection(id);
    const tab = referenceTabs[id];
    if (tab) setReferenceTab(tab);
  };

  const sections: {
    id: PhoneSection;
    label: string;
    title: string;
    icon: ReactNode;
    currentIcon: ReactNode;
    badge?: number;
    content: ReactNode;
  }[] = [
    {
      id: "page",
      label: onCharacter
        ? t("game.character", "Character")
        : t("game.overview", "Overview"),
      title: onCharacter
        ? t("character.character-sidebar.header", "Character")
        : t("game.overview-sidebar.header", "Game Overview"),
      icon: onCharacter ? <UserIcon /> : <UsersThreeIcon />,
      currentIcon: onCharacter ? (
        <UserIcon weight="fill" />
      ) : (
        <UsersThreeIcon weight="fill" />
      ),
      content: <Outlet />,
    },
    {
      id: "notes",
      label: t("game.notes", "Notes"),
      title: t("game.notes", "Notes"),
      icon: <FileTextIcon />,
      currentIcon: <FileTextIcon weight="fill" />,
      content: <NotesSection />,
    },
    {
      id: "moves",
      label: t("character.reference-sidebar-moves", "Moves"),
      title: t("character.reference-sidebar-moves", "Moves"),
      icon: <HandFistIcon />,
      currentIcon: <HandFistIcon weight="fill" />,
      content: <MoveTree />,
    },
    {
      id: "oracles",
      label: t("character.reference-sidebar-oracles", "Oracles"),
      title: t("character.reference-sidebar-oracles", "Oracles"),
      icon: <DiceFiveIcon />,
      currentIcon: <DiceFiveIcon weight="fill" />,
      content: <OracleTree />,
    },
    {
      id: "log",
      label: t("game.log", "Log"),
      title: t("character.reference-sidebar-game-log", "Game Log"),
      icon: <ChatsCircleIcon />,
      currentIcon: <ChatsCircleIcon weight="fill" />,
      badge: gameType !== GameType.Solo && unread > 0 ? unread : undefined,
      content: <GameLog open={section === "log"} />,
    },
  ];

  const items: MobileNavItem[] = sections.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    currentIcon: item.currentIcon,
    current: item.id === section,
    badge: item.badge,
    onSelect: () => select(item.id),
  }));

  return (
    <Flex direction="column" flex="1 1 auto" minHeight="0">
      {banner}
      {sections.map((item) => (
        <Box
          as="section"
          key={item.id}
          aria-labelledby={`game-phone-${item.id}-heading`}
          hidden={item.id !== section}
          display="flex"
          flex="1 1 auto"
          minHeight="0"
          overflowY="auto"
          flexDirection="column"
          css={{ "&[hidden]": { display: "none" } }}
        >
          <VisuallyHidden>
            <h2 id={`game-phone-${item.id}-heading`}>{item.title}</h2>
          </VisuallyHidden>
          <ErrorBoundary>{item.content}</ErrorBoundary>
        </Box>
      ))}
      <Box position="relative" flex="none">
        <RecentRollsDock />
        <MobileNav label={t("game.sections", "Game Sections")} items={items} />
      </Box>
    </Flex>
  );
}
