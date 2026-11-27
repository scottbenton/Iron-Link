import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Card, CardHeader, CardLinkOverlay } from "ui/components/Card";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { Box } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { useUsersGames } from "stores/users.games.store";

import { IGame } from "services/game.service";

import { GameCharacterPortraits } from "./GameCharacterPortraits";
import { getGameRulesPackageNames } from "./getGameRulesPackageNames";

export interface GameCardProps {
  gameId: string;
  game: IGame;
}

export function GameCard(props: GameCardProps) {
  const { gameId, game } = props;
  const { t } = useTranslation();

  const gameCharacters = useUsersGames(
    (store) => store.characterDisplayDetails[gameId],
  );
  const hasCharacters =
    !!gameCharacters && Object.keys(gameCharacters).length > 0;

  const rulesPackageString = useMemo(
    () => getGameRulesPackageNames(game.rulesets, game.expansions).join(", "),
    [game.rulesets, game.expansions],
  );

  // The portraits are pictures only, so their names are read here.
  const characterNames = useMemo(
    () =>
      Object.values(gameCharacters ?? {})
        .map((character) => character.name)
        .sort((a, b) => a.localeCompare(b))
        .join(", "),
    [gameCharacters],
  );

  return (
    <Card padding={hasCharacters ? "sm" : "md"} render={<li />}>
      <CardHeader
        titleAs="h2"
        avatar={
          gameCharacters && (
            <GameCharacterPortraits gameCharacterDetails={gameCharacters} />
          )
        }
        title={
          <CardLinkOverlay
            render={<LinkComponent href={pathConfig.game(gameId)} />}
          >
            <Box
              as="span"
              fontFamily="heading"
              textTransform="uppercase"
              letterSpacing="label"
            >
              {game.name}
            </Box>
          </CardLinkOverlay>
        }
        subtitle={
          <Box
            as="span"
            fontFamily="heading"
            textTransform="uppercase"
            letterSpacing="label"
          >
            {rulesPackageString}
          </Box>
        }
      />
      {characterNames && (
        <VisuallyHidden>
          {t("game.list.characters", "Characters: {{names}}", {
            names: characterNames,
          })}
        </VisuallyHidden>
      )}
    </Card>
  );
}
