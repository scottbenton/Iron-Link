import { Datasworn } from "@datasworn-community/core";
import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { OracleTable } from "../Oracle/OracleTable";

export interface MoveOraclesProps {
  move: Datasworn.AnyMove;
}

// A move's oracles: every roll button first, then the tables. A move with
// several tables (Delve the Depths' Edge, Shadow and Wits) used to put each
// button above its own table, so reaching Wits meant going through the other
// two tables, which is slow with a screen reader.
export function MoveOracles(props: MoveOraclesProps) {
  const { move } = props;

  const oracles = "oracles" in move ? move.oracles : undefined;

  const { t } = useTranslation();
  const rollOracle = useRollOracleAndAddToLog();

  const entries = Object.entries(oracles ?? {});

  if (entries.length === 0) {
    return null;
  }

  // With one table, the roll button right above it already names it.
  const hideTableLabels = entries.length === 1;

  return (
    <Box>
      <Box
        role={"group"}
        aria-label={t("datasworn.move-oracle-rolls", "{{moveName}} rolls", {
          moveName: move.name,
        })}
        display={"flex"}
        flexWrap={"wrap"}
        gap={1}
        mt={1}
      >
        {entries.map(([key, oracle]) => (
          <Button
            key={key}
            color="inherit"
            variant="outlined"
            onClick={() => rollOracle(oracle._id, false)}
          >
            {t("datasworn.roll-oracle", "Roll {{oracleName}}", {
              oracleName: oracle.name,
            })}
          </Button>
        ))}
      </Box>
      {entries.map(([key, oracle]) => (
        <Box mt={1} key={key}>
          <OracleTable
            oracle={oracle}
            label={oracle.name}
            hideLabel={hideTableLabels}
          />
        </Box>
      ))}
    </Box>
  );
}
