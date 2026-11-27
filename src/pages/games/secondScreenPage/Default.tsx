import { Text } from "ui/components/Text";
import { Logo } from "ui/layout/Logo";
import { VStack } from "ui/primitives";

import { useGameStore } from "stores/game.store";

/** What the second screen shows when nothing is on it: the game's name. */
export function Default() {
  const gameName = useGameStore((store) => store.game?.name);

  return (
    <VStack flex="1 1 auto" justifyContent="center" gap="4" paddingBottom="16">
      <Logo size={120} />
      <Text
        variant="display"
        css={{ fontSize: "clamp(3rem, 8vw, 6rem)", textAlign: "center" }}
      >
        {gameName}
      </Text>
    </VStack>
  );
}
