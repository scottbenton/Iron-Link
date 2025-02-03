import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AccordionSummary, Box, Typography } from "@mui/material";
import { ReactNode } from "react";

import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserNameWithStatus } from "stores/users.store";

export interface AccordionTitleProps {
  id: string;
  uid: string | null | undefined;
  characterId: string | null | undefined;
  title: string;
  titleSecondaryContent?: ReactNode;
}
export function AccordionTitle(props: AccordionTitleProps) {
  const { id, title, titleSecondaryContent, uid, characterId } = props;

  const hasMoreThanOneUser = useGameStore(
    (store) => Object.keys(store.gamePlayers ?? {}).length > 1,
  );
  const hasMoreThanOneCharacter = useGameCharactersStore(
    (store) => Object.keys(store.characters).length > 1,
  );

  const userName = useUserNameWithStatus(uid ?? "").name;
  const characterName = useGameCharactersStore((store) =>
    characterId ? store.characters[characterId]?.name : undefined,
  );

  const nameOverline =
    hasMoreThanOneCharacter && characterName
      ? characterName
      : hasMoreThanOneUser && userName
        ? userName
        : undefined;

  return (
    <AccordionSummary
      id={id}
      aria-controls={`${id}-accordion-content`}
      expandIcon={<ExpandMoreIcon />}
      sx={{
        flexDirection: "row-reverse",
        pl: 1,
      }}
    >
      <Box
        display="flex"
        flexGrow={1}
        alignItems="center"
        justifyContent="space-between"
        ml={1}
      >
        <Box>
          {nameOverline && (
            <Typography variant="overline" lineHeight={1.25}>
              {nameOverline}
            </Typography>
          )}

          <Typography>{title}</Typography>
        </Box>
        {titleSecondaryContent}
      </Box>
    </AccordionSummary>
  );
}
