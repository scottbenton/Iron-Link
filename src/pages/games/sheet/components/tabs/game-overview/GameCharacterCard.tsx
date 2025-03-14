import { PortraitAvatar } from "@/components/common/PortraitAvatar";
import { useSecondScreenFeature } from "@/hooks/advancedFeatures/useSecondScreenFeature";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useSetCharacterId } from "@/hooks/useCharacterId";
import { useGameId } from "@/hooks/useGameId";
import { ColorScheme } from "@/repositories/shared.types";
import { useSecondScreenStore } from "@/stores/secondScreen.store";
import { useUserName } from "@/stores/users.store";
import { Box, Button, Card, Heading, Icon } from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { useCallback } from "react";

export interface GameCharacterCardProps {
  character: CharacterCardConfig;
}

export interface CharacterCardConfig {
  id: string;
  uid: string;
  name: string;
  portraitSettings?: {
    filename: string;
    position: {
      x: number;
      y: number;
    };
    scale: number;
  };
  colorScheme?: ColorScheme;
}

export function GameCharacterCard(props: GameCharacterCardProps) {
  const { character } = props;

  const t = useGameTranslations();

  const gameId = useGameId();

  const isSecondScreenActive = useSecondScreenFeature();
  const userName = useUserName(character.uid);

  const isCharacterOpenOnSecondScreen = useSecondScreenStore(
    (store) =>
      store.settings?.type === "character" &&
      store.settings.characterId === character.id,
  );

  const openOnSecondScreen = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const id = character.id;
  const handleOpenOnSecondScreen = useCallback(() => {
    openOnSecondScreen(
      gameId,
      isCharacterOpenOnSecondScreen
        ? null
        : {
            type: "character",
            characterId: id,
          },
    ).catch(() => {});
  }, [isCharacterOpenOnSecondScreen, openOnSecondScreen, gameId, id]);

  const setCharacterId = useSetCharacterId();

  return (
    <Card.Root size="sm">
      <Card.Body
        as="button"
        onClick={() => setCharacterId(character.id)}
        borderRadius="inherit"
        pr={4}
        flexDir="row"
        alignItems="center"
        justifyContent="flex-start"
        _hover={{ bg: "bg.subtle" }}
        transitionProperty="scale"
        transitionDuration={"fast"}
        transitionTimingFunction="ease-in-out"
        textAlign="left"
        cursor="pointer"
      >
        <PortraitAvatar
          characterId={character.id}
          portraitSettings={character.portraitSettings}
          size="large"
          borderColor={character.colorScheme ?? "follow-theme"}
          borderWidth={2}
          name={character.name}
        />
        <Box ml={4} flexGrow={1}>
          <Heading size="2xl">{character.name}</Heading>
          <Heading size="md" color="fg.muted">
            {userName}
          </Heading>
        </Box>
        <Box>
          <Icon asChild color="fg.subtle">
            <ChevronRight />
          </Icon>
        </Box>
      </Card.Body>
      {isSecondScreenActive && (
        <Card.Footer
          bg="bg.muted"
          borderBottomRadius={"inherit"}
          py={1}
          justifyContent={"end"}
        >
          <Button
            variant={isCharacterOpenOnSecondScreen ? "subtle" : "ghost"}
            onClick={handleOpenOnSecondScreen}
          >
            {isCharacterOpenOnSecondScreen
              ? t(
                  "character-card-second-screen-button-on-screen",
                  "Remove from Guide Screen",
                )
              : t(
                  "character-card-second-screen-button-send-to-screen",
                  "Display on Guide Screen",
                )}
          </Button>
        </Card.Footer>
      )}
    </Card.Root>
  );
}
