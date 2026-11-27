import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { HStack, Stack } from "ui/primitives";

import { askTheOracleIds, askTheOracleLabels } from "data/askTheOracle";

export interface AskTheOracleButtonsProps {
  rollOracle: (oracleId: string) => void;
}

// The yes or no oracles, one button per likelihood.
export function AskTheOracleButtons(props: AskTheOracleButtonsProps) {
  const { rollOracle } = props;
  const { t } = useTranslation();
  const labelId = useId();

  return (
    <Stack gap="1.5" role="group" aria-labelledby={labelId}>
      <Text id={labelId} variant="label" color="muted">
        {t("datasworn.ask-the-oracle", "Ask the Oracle")}
      </Text>
      <HStack gap="1.5" flexWrap="wrap">
        {askTheOracleIds.map((oracleId) => (
          <Button
            key={oracleId}
            variant="outline"
            size="sm"
            onClick={() => rollOracle(oracleId)}
          >
            {askTheOracleLabels[oracleId]}
          </Button>
        ))}
      </HStack>
    </Stack>
  );
}
