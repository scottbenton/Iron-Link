import { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import { OracleTable } from "ui/game/OracleTable";
import { RollButton } from "ui/game/RollButton";
import { Flex, Stack } from "ui/primitives";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

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

  // With one table, the roll button right above it already names it, so
  // its name is read by screen readers only.
  const hideTableNames = entries.length === 1;

  return (
    <Stack gap="3" marginBlockStart="2">
      <Flex
        role="group"
        aria-label={t("datasworn.move-oracle-rolls", "{{moveName}} rolls", {
          moveName: move.name,
        })}
        flexWrap="wrap"
        gap="2"
      >
        {entries.map(([key, oracle]) => (
          <RollButton
            key={key}
            size="sm"
            onRoll={() => void rollOracle(oracle._id, false)}
          >
            {t("datasworn.roll-oracle", "Roll {{oracleName}}", {
              oracleName: oracle.name,
            })}
          </RollButton>
        ))}
      </Flex>
      {/* More space between tables than inside one, so each reads as its own group. */}
      <Stack gap="5">
        {entries.map(([key, oracle]) => (
          <OracleTable
            key={key}
            oracle={oracle}
            hideHeader={hideTableNames}
            titleAs="p"
          />
        ))}
      </Stack>
    </Stack>
  );
}
