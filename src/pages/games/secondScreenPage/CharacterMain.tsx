import { Box, Card, Typography } from "@mui/material";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

interface CharacterMainProps {
  characterId: string;
}

export function CharacterMain(props: CharacterMainProps) {
  const { characterId } = props;

  const filename = useGameCharactersStore(
    (store) => store.characters[characterId]?.profileImage?.filename,
  );
  const characterName = useGameCharactersStore(
    (store) => store.characters[characterId]?.name ?? "",
  );

  useLoadCharacterPortrait(characterId, filename);
  const portraitUrl = useCharacterPortrait(characterId).url;

  return (
    <>
      <Box
        flexGrow={1}
        position="relative"
        overflow="hidden"
        bgcolor="grey.950"
      >
        {filename ? (
          <>
            <Box
              component="img"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "top",
              }}
              src={portraitUrl}
              alt={characterName}
            />
            <Card
              sx={{
                px: 2,
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translate(-50%, 0)",
              }}
            >
              <Typography
                variant="h2"
                component="h1"
                fontFamily="fontFamilyTitle"
                whiteSpace={"nowrap"}
              >
                {characterName}
              </Typography>
            </Card>
          </>
        ) : (
          <Typography variant="h1" component="h1" fontFamily="fontFamilyTitle">
            {characterName}
          </Typography>
        )}
      </Box>
    </>
  );
}
