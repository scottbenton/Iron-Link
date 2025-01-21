import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { useMemo } from "react";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { useUsersGames } from "stores/users.games.store";

import {
  defaultBaseRulesets,
  defaultExpansions,
} from "data/datasworn.packages";

import { IGame } from "services/game.service";

import { GameCharacterPortraits } from "./GameCharacterPortraits";

export interface GameCardProps {
  gameId: string;
  game: IGame;
}

export function GameCard(props: GameCardProps) {
  const { gameId, game } = props;

  const { rulesets, expansions } = game;

  const gameCharacters = useUsersGames(
    (store) => store.characterDisplayDetails[gameId] ?? {},
  );

  const rulesPackageString = useMemo(() => {
    const packageNames: string[] = [];

    Object.entries(rulesets).forEach(([rulesetId, isRulesetActive]) => {
      if (isRulesetActive) {
        const ruleset = defaultBaseRulesets[rulesetId];
        packageNames.push(ruleset.title);

        Object.entries(expansions[rulesetId] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive) {
              const expansion = defaultExpansions[rulesetId]?.[expansionId];
              packageNames.push(expansion.title);
            }
          },
        );
      }
    });

    return packageNames.join(", ");
  }, [rulesets, expansions]);

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
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
