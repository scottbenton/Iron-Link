import { askTheOracleIds, askTheOracleLabels } from "@/data/askTheOracle";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "@/hooks/useRollOracleAndAddToLog";
import { GamePermission } from "@/stores/game.store";
import { Box, Button, Text } from "@chakra-ui/react";

export function AskTheOracleButtons() {
  const rollOracleTable = useRollOracleAndAddToLog();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;

  const t = useDataswornTranslations();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      bg="bg.subtle"
      borderBottomWidth={1}
      borderColor="border"
    >
      <Text fontFamily="heading" color="fg.muted">
        {t("datasworn.ask-the-oracle", "Ask the Oracle")}
      </Text>
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        justifyContent="center"
      >
        {askTheOracleIds.map((oracleKey) => (
          <Button
            key={oracleKey}
            size={"sm"}
            variant="ghost"
            colorPalette={"gray"}
            fontFamily={"heading"}
            lineHeight={1}
            minW={0}
            px={1}
            onClick={() => rollOracleTable(oracleKey, isGuide)}
          >
            {askTheOracleLabels[oracleKey]}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
