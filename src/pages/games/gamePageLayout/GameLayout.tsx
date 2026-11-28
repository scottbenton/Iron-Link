import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { useFillShell } from "components/Layout/useFillShell";

import { Progress } from "ui/components/Progress";
import { EmptyState, GameBanner, GamePageFrame, PageContent } from "ui/layout";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { GameSettings } from "pages/games/gamePageLayout/GameSettings";
import { GameColumns } from "pages/games/gamePageLayout/components/GameColumns";
import { GamePageNavBar } from "pages/games/gamePageLayout/components/GamePageNavBar";
import { GameTabs } from "pages/games/gamePageLayout/components/GameTabs";
import { PhoneGamePage } from "pages/games/gamePageLayout/components/PhoneGamePage";
import { WorldsBetaBanner } from "pages/games/gamePageLayout/components/WorldsBetaBanner";
import { useSyncGame } from "pages/games/gamePageLayout/hooks/useSyncGame";
import { useSyncColorScheme } from "pages/games/hooks/useSyncColorScheme";

import { useShowWorldsBetaBanner } from "hooks/advancedFeatures/worldsBetaBanner";
import { useDocumentTitle } from "hooks/useDocumentTitle";

import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";
import { useSyncSecondScreenSettingsIfActive } from "stores/secondScreen.store";

import { useGameId } from "./hooks/useGameId";
import { useGameKeybinds } from "./hooks/useGameKeybinds";
import { useGamePageTier } from "./hooks/useGamePageTier";
import { useIsOnCharacterCreatePage } from "./hooks/useIsOnCharacterCreatePage";
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
  const isOnCreatePage = useIsOnCharacterCreatePage();
  const tier = useGamePageTier();
  const phone = tier === "phone";

  const showWorldsBetaBanner = useShowWorldsBetaBanner(gameId);
  const betaBanner = showWorldsBetaBanner ? (
    <WorldsBetaBanner gameId={gameId} />
  ) : undefined;
  // GameColumns' layout frames its banner edge to edge; the phone page and
  // character creation frame theirs the same way.
  const framedBanner = betaBanner && <GameBanner>{betaBanner}</GameBanner>;

  const hasGame = useGameStore((state) => !!state.game);
  const error = useGameStore((state) => state.error);
  const rulesPackageLoadError = useDataswornTreeStore(
    (store) => store.rulesError,
  );

  const gameName = useGameStore((state) => state.game?.name);
  const characterName = useGameCharacter((character) => character?.name);
  let documentTitle: string | undefined = gameName;
  if (gameName && isOnCreatePage) {
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

  const ready = hasGame && !error && !rulesPackageLoadError;
  // Character creation is a page that scrolls; the rest keeps its columns
  // (or a phone's sections) in view, each scrolling on its own.
  useFillShell(ready && !isOnCreatePage);

  if (!hasGame && !error && !rulesPackageLoadError) {
    return <Progress />;
  }

  if (error) {
    return (
      <EmptyState
        title={t("game.load-failure", "Failed to load game.")}
        titleAs="h1"
      />
    );
  }

  if (rulesPackageLoadError) {
    return (
      <EmptyState
        title={t("game.rules-load-failure", "Failed to load rules package.")}
        titleAs="h1"
      />
    );
  }

  if (isOnCreatePage) {
    return (
      <>
        <GamePageNavBar phone={phone} />
        <GameSettings />
        {framedBanner}
        <GamePageFrame tabs={!phone && <GameTabs />}>
          <PageContent maxWidth="md">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </PageContent>
        </GamePageFrame>
      </>
    );
  }

  return (
    <>
      <GamePageNavBar phone={phone} />
      <GameSettings />
      {phone ? (
        <PhoneGamePage
          onCharacter={!!characterId}
          pageKey={characterId ?? "overview"}
          banner={framedBanner}
        />
      ) : (
        <GameColumns
          tier={tier}
          onCharacter={!!characterId}
          tabs={<GameTabs />}
          banner={betaBanner}
        />
      )}
    </>
  );
}
