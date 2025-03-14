import { ClipboardIconButton, ClipboardRoot } from "@/components/ui/clipboard";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameId } from "@/hooks/useGameId";
import { useGameStore } from "@/stores/game.store";
import { Alert, Box, Group, Heading, Skeleton, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

export function GameInviteButton() {
  const t = useGameTranslations();

  const gameId = useGameId();

  const loadGameInviteKey = useGameStore((state) => state.getGameInviteKey);

  const [inviteKey, setInviteKey] = useState<string | null>(null);
  const [inviteKeyLoading, setInviteKeyLoading] = useState(true);
  const [inviteKeyError, setInviteKeyError] = useState<string | null>(null);
  const isAlreadyLoadingRef = useRef(false);

  const inviteURL = location.origin + "/join/";

  useEffect(() => {
    const handleFetchInviteKey = async () => {
      if (isAlreadyLoadingRef.current) return;
      isAlreadyLoadingRef.current = true;
      loadGameInviteKey(gameId)
        .then((key) => {
          setInviteKey(key);
          setInviteKeyLoading(false);
        })
        .catch(() => {
          setInviteKeyLoading(false);
          setInviteKeyError(
            t("game.invite.error", "Failed to load invite key"),
          );
        });
    };

    handleFetchInviteKey();
  }, [gameId, t, loadGameInviteKey]);

  return (
    <Box>
      <Heading size="md" color="fg.muted" mt={4}>
        {t("game.invite.heading", "Invite link")}
      </Heading>
      {inviteKeyError && (
        <Alert.Root status="error">
          <Alert.Description>{inviteKeyError}</Alert.Description>
        </Alert.Root>
      )}
      <Skeleton loading={inviteKeyLoading} height={10} alignSelf={"flex-start"}>
        <Group attached maxW="full" alignItems="stretch">
          <Box
            px={2}
            borderWidth={1}
            borderRightWidth={0}
            borderLeftRadius={"sm"}
            flexGrow={1}
            overflow="hidden"
            display="flex"
            alignItems="center"
          >
            <Text truncate>{inviteURL + inviteKey}</Text>
          </Box>
          {inviteKey && (
            <ClipboardRoot value={inviteURL + inviteKey} colorPalette={"gray"}>
              <ClipboardIconButton variant="outline" borderLeftRadius={0} />
            </ClipboardRoot>
          )}
        </Group>
      </Skeleton>
    </Box>
  );
}
