import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { Box, Center } from "ui/primitives";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

interface CharacterMainProps {
  characterId: string;
}

/** A character on the second screen's main area: the portrait and the name. */
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

  if (!filename) {
    return (
      <Center flex="1 1 auto" padding="6">
        <Text variant="display" as="h1" align="center">
          {characterName}
        </Text>
      </Center>
    );
  }

  return (
    <Box
      flex="1 1 auto"
      position="relative"
      overflow="hidden"
      css={{
        "& > img": {
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "top",
        },
      }}
    >
      <img
        src={portraitUrl}
        // The name is the heading below, so the portrait doesn't repeat it.
        alt=""
      />
      <Card
        padding="sm"
        raised
        css={{
          position: "absolute",
          bottom: "4",
          left: "50%",
          transform: "translateX(-50%)",
          paddingX: "4",
        }}
      >
        <Text variant="h1" as="h1" css={{ whiteSpace: "nowrap" }}>
          {characterName}
        </Text>
      </Card>
    </Box>
  );
}
