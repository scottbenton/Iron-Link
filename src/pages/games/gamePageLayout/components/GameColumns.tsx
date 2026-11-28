import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";

import { BookOpenIcon, UserIcon, UsersThreeIcon } from "ui/icons";
import { GameLayout } from "ui/layout";

import { NotesSection } from "pages/games/characterSheet/components/NotesSection";
import { ReferenceSidebarContents } from "pages/games/characterSheet/components/ReferenceSidebarContents";

import { ReferenceTabs, useAppState } from "stores/appState.store";
import {
  CharacterSheetSection,
  GameOverviewSection,
  useGamePageLayoutStore,
} from "stores/gamePageLayout.store";

import {
  useCharacterSheetSections,
  useGameOverviewSections,
  useReferenceSections,
} from "../columns";
import { OVERVIEW_ID, REFERENCE_ID } from "../hooks/useGameKeybinds";
import { GamePageTier } from "../hooks/useGamePageTier";

export interface GameColumnsProps {
  tier: Exclude<GamePageTier, "phone">;
  /** A character's page, rather than the game's overview. */
  onCharacter: boolean;
  tabs: ReactNode;
  banner?: ReactNode;
}

/**
 * The game page from 600px: the page tabs over the sheet (or the game's
 * overview), the notes and the reference. Each sidebar's width and
 * collapsed state is kept per device.
 */
export function GameColumns(props: GameColumnsProps) {
  const { tier, onCharacter, tabs, banner } = props;
  const { t } = useTranslation();

  const characterSections = useCharacterSheetSections();
  const overviewSections = useGameOverviewSections();
  const referenceSections = useReferenceSections();

  const layout = useGamePageLayoutStore();
  const referenceSection = useAppState((state) => state.currentReferenceTab);
  const setReferenceSection = useAppState(
    (state) => state.setCurrentReferenceTab,
  );

  const pinnable = tier !== "compact";

  return (
    <GameLayout
      banner={banner}
      tabs={tabs}
      stackSidebars={tier !== "wide"}
      main={{
        id: "notes",
        title: t("game.notes", "Notes"),
        hideTitle: true,
        content: (
          <ErrorBoundary>
            <NotesSection />
          </ErrorBoundary>
        ),
      }}
      startSidebar={{
        panels: [
          onCharacter
            ? {
                id: "sheet",
                title: t("character.character-sidebar.header", "Character"),
                icon: <UserIcon />,
                headingId: OVERVIEW_ID,
                sections: characterSections,
                activeSectionId: layout.characterSection,
                onActiveSectionChange: (id) =>
                  layout.setCharacterSection(id as CharacterSheetSection),
                content: (
                  <ErrorBoundary>
                    <Outlet />
                  </ErrorBoundary>
                ),
              }
            : {
                id: "sheet",
                title: t("game.overview-sidebar.header", "Game Overview"),
                icon: <UsersThreeIcon />,
                headingId: OVERVIEW_ID,
                sections: overviewSections,
                activeSectionId: layout.overviewSection,
                onActiveSectionChange: (id) =>
                  layout.setOverviewSection(id as GameOverviewSection),
                content: (
                  <ErrorBoundary>
                    <Outlet />
                  </ErrorBoundary>
                ),
              },
        ],
        width: layout.sheetWidth,
        onWidthChange: layout.setSheetWidth,
        collapsed: layout.sheetCollapsed,
        onCollapsedChange: layout.setSheetCollapsed,
        pinnable,
      }}
      endSidebar={{
        panels: [
          {
            id: "reference",
            title: t("game.reference", "Reference"),
            icon: <BookOpenIcon />,
            headingId: REFERENCE_ID,
            sections: referenceSections,
            activeSectionId: referenceSection,
            onActiveSectionChange: (id) =>
              setReferenceSection(id as ReferenceTabs),
            content: (
              <ErrorBoundary>
                <ReferenceSidebarContents />
              </ErrorBoundary>
            ),
          },
        ],
        width: layout.referenceWidth,
        onWidthChange: layout.setReferenceWidth,
        collapsed: layout.referenceCollapsed,
        onCollapsedChange: layout.setReferenceCollapsed,
        pinnable,
      }}
    />
  );
}
