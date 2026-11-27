import { useTranslation } from "react-i18next";

import { CharacterPortrait, PortraitSize } from "ui/game/CharacterPortrait";
import { Box } from "ui/primitives";

import { useUID } from "stores/auth.store";
import { GameCharacterDisplayDetails } from "stores/users.games.store";

export interface GameCharacterPortraitsProps {
  gameCharacterDetails: Record<string, GameCharacterDisplayDetails>;
}

/**
 * A game's characters in one 88px square: one large portrait, two
 * overlapping, or up to four small ones (three and a count past four).
 * Pictures only: GameCard names the characters in text.
 */
export function GameCharacterPortraits(props: GameCharacterPortraitsProps) {
  const { gameCharacterDetails } = props;
  const { t } = useTranslation();
  const uid = useUID();

  // The reader's own characters first, then by name.
  const characters = Object.entries(gameCharacterDetails).sort(
    ([, a], [, b]) => {
      if (a.uid !== b.uid) {
        if (a.uid === uid) return -1;
        if (b.uid === uid) return 1;
      }
      return a.name.localeCompare(b.name);
    },
  );

  if (characters.length === 0) return null;

  const portrait = (
    [characterId, details]: (typeof characters)[number],
    size: PortraitSize,
  ) => (
    <CharacterPortrait
      key={characterId}
      name={details.name}
      portraitUrl={details.profileImageURL ?? undefined}
      crop={details.profileImageSettings ?? undefined}
      size={size}
      shape="rounded"
      decorative
    />
  );

  if (characters.length === 1) {
    return (
      <Box position="relative" flex="none" width="88px" height="88px">
        {portrait(characters[0], "xl")}
      </Box>
    );
  }

  if (characters.length === 2) {
    // The reader's own character in front, at the bottom right.
    return (
      <Box
        position="relative"
        flex="none"
        width="88px"
        height="88px"
        css={{
          "& > :last-child": {
            position: "absolute",
            insetInlineEnd: "0",
            bottom: "0",
          },
        }}
      >
        {portrait(characters[1], "lg")}
        {portrait(characters[0], "lg")}
      </Box>
    );
  }

  const shown = characters.length > 4 ? characters.slice(0, 3) : characters;
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      alignContent="center"
      justifyContent="center"
      flex="none"
      width="88px"
      height="88px"
    >
      {shown.map((character) => portrait(character, "md"))}
      {characters.length > 4 && (
        <Box
          as="span"
          aria-hidden
          display="grid"
          placeItems="center"
          width="44px"
          height="44px"
          boxSizing="border-box"
          borderRadius="md"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border.default"
          bg="bg.muted"
          color="fg.muted"
          fontFamily="heading"
          fontWeight="bold"
          fontVariantNumeric="tabular-nums"
        >
          {t("game.list.more-characters", "+{{count}}", {
            count: characters.length - 3,
          })}
        </Box>
      )}
    </Box>
  );
}
