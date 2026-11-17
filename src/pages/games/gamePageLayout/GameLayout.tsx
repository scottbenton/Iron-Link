import { LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { GameBottomNav } from "pages/games/gamePageLayout/GameBottomNav";
import { GameNavBar } from "pages/games/gamePageLayout/GameNavBar";
import { MobileTabs } from "pages/games/gamePageLayout/MobileTabs";
import { SidebarLayout } from "pages/games/gamePageLayout/SidebarLayout";
import { GameTabs } from "pages/games/gamePageLayout/components/GameTabs";
import { WorldsBetaBanner } from "pages/games/gamePageLayout/components/WorldsBetaBanner";
import { useSyncGame } from "pages/games/gamePageLayout/hooks/useSyncGame";
import { useSyncColorScheme } from "pages/games/hooks/useSyncColorScheme";

import { useShowWorldsBetaBanner } from "hooks/advancedFeatures/worldsBetaBanner";
import { useDocumentTitle } from "hooks/useDocumentTitle";
import { useIsMobile } from "hooks/useIsMobile";

import { useAppState } from "stores/appState.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";
import { useSyncSecondScreenSettingsIfActive } from "stores/secondScreen.store";

import { useGameId } from "./hooks/useGameId";
import { useGameKeybinds } from "./hooks/useGameKeybinds";
import { useSyncOpenNoteItem } from "./hooks/useSyncOpenNoteItem";

export default function GameLayout() {
  const { t } = useTranslation();

  useGameKeybinds();
  useSyncGame();
  useSyncColorScheme();
  useSyncSecondScreenSettingsIfActive();
  useSyncOpenNoteItem();

  const characterId = useCharacterIdOptional();
  const gameId = useGameId();
  const showWorldsBetaBanner = useShowWorldsBetaBanner(gameId);
  const worldsBetaBanner = showWorldsBetaBanner && (
    <WorldsBetaBanner gameId={gameId} />
  );

  const hasGame = useGameStore((state) => !!state.game);
  const error = useGameStore((state) => state.error);
  const rulesPackageLoadError = useDataswornTreeStore(
    (store) => store.rulesError,
  );

  const { pathname } = useLocation();

  const isOnCharacterCreatePage =
    pathname.match(/\/games\/[^/]*\/create[/]?$/i) !== null;

  const isOnOverviewPage = !isOnCharacterCreatePage && !characterId;

  const gameName = useGameStore((state) => state.game?.name);
  const characterName = useGameCharacter((character) => character?.name);
  let documentTitle: string | undefined = gameName;
  if (gameName && isOnCharacterCreatePage) {
    documentTitle = t(
      "game.document-title.add-character",
      "Add Character | {{gameName}}",
      { gameName },
    );
  } else if (gameName && characterId) {
    documentTitle = characterName
      ? t("game.document-title.character", "{{characterName}} | {{gameName}}", {
          characterName,
          gameName,
        })
      : undefined;
  }
  useDocumentTitle(documentTitle);

  const isMobile = useIsMobile();

  const [openMobileTab, setOpenMobileTab] = useState(MobileTabs.Sheet);

  useEffect(() => {
    setOpenMobileTab(MobileTabs.Sheet);
  }, [isOnOverviewPage, characterId]);

  // Phones show the Reference panel only while one of its bottom nav items
  // is open, which decides whether the game log counts as read.
  const isReferencePanelVisible =
    !isMobile || openMobileTab === MobileTabs.Reference;
  const setIsReferencePanelVisible = useAppState(
    (state) => state.setIsReferencePanelVisible,
  );
  useEffect(() => {
    setIsReferencePanelVisible(isReferencePanelVisible);
  }, [isReferencePanelVisible, setIsReferencePanelVisible]);
  useEffect(() => {
    return () => setIsReferencePanelVisible(true);
  }, [setIsReferencePanelVisible]);

  if (!hasGame && !error && !rulesPackageLoadError) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <EmptyState message={t("game.load-failure", "Failed to load game.")} />
    );
  }

  if (rulesPackageLoadError) {
    return (
      <EmptyState
        message={t("game.rules-load-failure", "Failed to load rules package.")}
      />
    );
  }

  if (isOnCharacterCreatePage) {
    return (
      <>
        <GameNavBar isOnCreatePage />
        {worldsBetaBanner}

        {!isMobile && (
          <PageHeader
            maxWidth={"md"}
            disablePadding
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <GameTabs />
          </PageHeader>
        )}
        <PageContent viewHeight={"min-full"} maxWidth={"md"}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <GameNavBar isOnCreatePage={isOnCharacterCreatePage} />
      {worldsBetaBanner}
      {!isMobile && (
        <PageHeader
          maxWidth={isOnCharacterCreatePage ? "md" : undefined}
          disablePadding
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <GameTabs />
        </PageHeader>
      )}
      <PageContent
        disablePadding={!isOnCharacterCreatePage || isMobile}
        viewHeight={isOnCharacterCreatePage ? "min-full" : "max-full"}
        maxWidth={isOnCharacterCreatePage ? "md" : undefined}
      >
        <ErrorBoundary>
          <SidebarLayout currentOpenTab={openMobileTab} />
        </ErrorBoundary>
      </PageContent>
      {isMobile && (
        <GameBottomNav
          mobileTab={openMobileTab}
          setMobileTab={setOpenMobileTab}
          isOnOverviewPage={isOnOverviewPage}
        />
      )}
    </>
  );
}
