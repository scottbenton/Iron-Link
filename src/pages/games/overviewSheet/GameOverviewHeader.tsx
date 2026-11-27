import { Text } from "ui/components/Text";
import { GameSettingsMenu } from "ui/layout";
import { Flex } from "ui/primitives";

import { ContributedSettingsAction } from "stores/appSettingsMenu.store";

import { useGameSettingsContribution } from "../gamePageLayout/GameSettings/useGameSettingsContribution";

/**
 * The game's name across the top of its overview, with the game's settings
 * beside it. The rail's menu has the same settings. The name is the page's
 * h1 already, so here it only looks like a heading.
 */
export function GameOverviewHeader() {
  const settings = useGameSettingsContribution();
  if (!settings) return null;

  const { game } = settings;
  return (
    <Flex alignItems="center" gap="2">
      <Text
        variant="h3"
        as="p"
        css={{ flex: "1 1 auto", minWidth: 0, overflowWrap: "anywhere" }}
      >
        {game.name}
      </Text>
      <GameSettingsMenu
        game={game}
        // Only Guides can change the game's theme, which Change Theme
        // opens the Theme dialog for.
        showTheme={game.isGuide}
        logSound={settings.logSound}
        onLogSoundChange={settings.onLogSoundChange}
        // The game's menu offers only the game's own items, never the
        // app's, so every action it sends is one the page handles.
        onSelect={(action) =>
          settings.onSelect(action as ContributedSettingsAction)
        }
        onDeleteGame={settings.onDeleteGame}
      />
    </Flex>
  );
}
