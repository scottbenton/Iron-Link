import { LinearProgress, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { GameNavBar } from "pages/games/gamePageLayout/GameNavBar";
import { MobileTabs } from "pages/games/gamePageLayout/MobileTabs";
import { SidebarLayout } from "pages/games/gamePageLayout/SidebarLayout";
import { GameTabs } from "pages/games/gamePageLayout/components/GameTabs";
import { useSyncGame } from "pages/games/gamePageLayout/hooks/useSyncGame";
import { useSyncColorScheme } from "pages/games/hooks/useSyncColorScheme";

import { useGameStore } from "stores/game.store";

export default function GameLayout() {
  const { t } = useTranslation();

  useSyncGame();
  useSyncColorScheme();
  const characterId = useCharacterIdOptional();

  const hasGame = useGameStore((state) => !!state.game);
  const error = useGameStore((state) => state.error);

  const { pathname } = useLocation();

  const isOnCharacterCreatePage =
    pathname.match(/\/games\/[^/]*\/create[/]?$/i) !== null;

  const isOnOverviewPage = !isOnCharacterCreatePage && !characterId;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [openMobileTab, setOpenMobileTab] = useState(MobileTabs.Outlet);

  useEffect(() => {
    setOpenMobileTab(MobileTabs.Outlet);
  }, [isOnOverviewPage, characterId]);

  if (!hasGame && !error) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <EmptyState message={t("game.load-failure", "Failed to load game.")} />
    );
  }

  if (isOnCharacterCreatePage) {
    return (
      <>
        <GameNavBar
          tab={openMobileTab}
          setTab={setOpenMobileTab}
          isOnCreatePage
          isOnOverviewPage={false}
        />

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
          <Outlet />
        </PageContent>
      </>
    );
  }

  return (
    <>
      <GameNavBar
        tab={openMobileTab}
        setTab={setOpenMobileTab}
        isOnOverviewPage={isOnOverviewPage}
        isOnCreatePage={isOnCharacterCreatePage}
      />
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
        <SidebarLayout currentOpenTab={openMobileTab} />
      </PageContent>
    </>
  );
}
