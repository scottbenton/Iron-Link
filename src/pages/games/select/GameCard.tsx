import {
  defaultBaseRulesets,
  defaultExpansions,
} from "@/data/datasworn.packages";
import { pageConfig } from "@/pages/pageConfig";
import { IGame } from "@/services/game.service";
import { useUsersGames } from "@/stores/users.games.store";
import { Box, Card, Heading, LinkBox, LinkOverlay } from "@chakra-ui/react";
import { useMemo } from "react";
import { Link } from "wouter";

import { GameCharacterPortraits } from "./GameCharacterPortraits";

// import { GameCharacterPortraits } from "./GameCharacterPortraits";

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
    <Card.Root
      scale={1}
      _hover={{ scale: 1.02, bg: "bg.subtle" }}
      transitionProperty="scale"
      transitionDuration={"fast"}
      transitionTimingFunction="ease-in-out"
      h="full"
    >
      <LinkBox asChild>
        <Card.Body
          display="flex"
          flexDirection="row"
          height="100%"
          p={2}
          alignItems="center"
        >
          <GameCharacterPortraits gameCharacterDetails={gameCharacters} />
          <Box ml={4}>
            <Heading as="div" textTransform="uppercase" size="2xl">
              <LinkOverlay asChild>
                <Link to={pageConfig.game(gameId)}>{game.name}</Link>
              </LinkOverlay>
            </Heading>
            <Heading
              as="div"
              color="fg.muted"
              textTransform="uppercase"
              size="md"
            >
              {rulesPackageString}
            </Heading>
          </Box>
        </Card.Body>
      </LinkBox>
    </Card.Root>
  );
}
