import { useTranslation } from "react-i18next";

import { AnyOracleRollable, OracleTable } from "ui/game/OracleTable";
import { RollButton } from "ui/game/RollButton";
import { RulesText } from "ui/game/RulesText";
import { Box, Stack } from "ui/primitives";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

export interface OracleVariantProps {
  oracle: AnyOracleRollable;
}

// One oracle's summary, roll button and table. Whatever shows it names the
// oracle already (a dialog title, a page heading or a tab), so the table's
// own name is read by screen readers only.
export function OracleVariant(props: OracleVariantProps) {
  const { oracle } = props;
  const { t } = useTranslation();
  const rollOracle = useRollOracleAndAddToLog();

  // Datasworn's types leave summary off rollable oracles, which carry one.
  const summary = (oracle as { summary?: string }).summary;

  return (
    <Stack gap="4">
      {summary && <RulesText markdown={summary} size="sm" />}
      <Box>
        <RollButton size="sm" onRoll={() => void rollOracle(oracle._id)}>
          {t("datasworn.roll-oracle-button", "Roll {{oracleName}}", {
            oracleName: oracle.name,
          })}
        </RollButton>
      </Box>
      <OracleTable oracle={oracle} hideHeader />
    </Stack>
  );
}
