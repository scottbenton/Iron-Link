import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { ScreenReaderOnly } from "components/ScreenReaderOnly";

import { pathConfig } from "pages/pathConfig";

import { useUsersGames } from "stores/users.games.store";

import { includedExpansions, includedRulesets } from "data/package.config";

import { IGame } from "services/game.service";

import { GameCharacterPortraits } from "./GameCharacterPortraits";

export interface GameCardProps {
  gameId: string;
  game: IGame;
}

export function GameCard(props: GameCardProps) {
  const { gameId, game } = props;

  const { rulesets, expansions } = game;
  const { t } = useTranslation();

  const gameCharacters = useUsersGames(
    (store) => store.characterDisplayDetails[gameId] ?? {},
  );

  const rulesPackageString = useMemo(() => {
    const packageNames: string[] = [];

    Object.entries(rulesets).forEach(([rulesetId, isRulesetActive]) => {
      if (isRulesetActive) {
        const ruleset = includedRulesets[rulesetId];
        packageNames.push(ruleset.name);

        Object.entries(expansions[rulesetId] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive) {
              const expansion = includedExpansions[rulesetId]?.[expansionId];
              packageNames.push(expansion.name);
            }
          },
        );
      }
    });

    return packageNames.join(", ");
  }, [rulesets, expansions]);

  // The portraits are pictures only, so their names are read here.
  const characterNames = useMemo(
    () =>
      Object.values(gameCharacters)
        .map((character) => character.name)
        .sort((a, b) => a.localeCompare(b))
        .join(", "),
    [gameCharacters],
  );

  return (
    <Card variant={"outlined"} sx={{ height: "100%", overflow: "visible" }}>
      <CardActionArea
        LinkComponent={LinkComponent}
        sx={{
          p: Object.keys(gameCharacters).length > 0 ? 1 : 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          height: "100%",
          overflow: "visible",
        }}
        href={pathConfig.game(gameId)}
      >
        <Box display="flex" alignItems="center">
          <GameCharacterPortraits gameCharacterDetails={gameCharacters} />
          <Box ml={2}>
            <Typography
              variant={"h5"}
              component={"h2"}
              fontFamily={(theme) => theme.typography.fontFamilyTitle}
              textTransform="uppercase"
            >
              {game.name}
            </Typography>
            <Typography
              color="text.secondary"
              fontFamily={(theme) => theme.typography.fontFamilyTitle}
              textTransform="uppercase"
            >
              {rulesPackageString}
            </Typography>
            {characterNames && (
              <ScreenReaderOnly>
                {t("game.list.characters", "Characters: {{names}}", {
                  names: characterNames,
                })}
              </ScreenReaderOnly>
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
