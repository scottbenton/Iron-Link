import { OracleTable } from "@/components/datasworn/Oracle/OracleTable";
import { useRollOracleAndAddToLog } from "@/hooks/useRollOracleAndAddToLog";
import { Box, Button } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { useTranslation } from "react-i18next";

export interface MoveOraclesProps {
  move: Datasworn.AnyMove;
}
export function MoveOracles(props: MoveOraclesProps) {
  const { move } = props;

  const oracles = "oracles" in move ? move.oracles : undefined;

  const { t } = useTranslation();
  const rollOracle = useRollOracleAndAddToLog();

  if (!oracles) {
    return null;
  }

  return (
    <Box>
      {Object.entries(oracles).map(([key, oracle]) => (
        <Box mt={2} key={key}>
          <Button
            key={key}
            colorPalette={"gray"}
            variant="outline"
            onClick={() => rollOracle(oracle._id, false)}
          >
            {t("datasworn.roll-oracle", "Roll {{oracleName}}", {
              oracleName: oracle.name,
            })}
          </Button>
          <OracleTable oracle={oracle} />
        </Box>
      ))}
    </Box>
  );
}
