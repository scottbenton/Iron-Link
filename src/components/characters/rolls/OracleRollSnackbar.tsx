import { useTranslation } from "react-i18next";

import { useOracleRollable } from "hooks/datasworn/useOracleRollable";

import { isOracleRollMatch } from "lib/rollSummary.lib";

import { IOracleTableRoll } from "services/gameLog.service";

import { RollContainer, RollResult, RollTitle, RollValues } from "./common";

export interface OracleRollSnackbarProps {
  rollId: string | undefined;
  roll: IOracleTableRoll;
  isExpanded: boolean;
}

export function OracleRollSnackbar(props: OracleRollSnackbarProps) {
  const { roll, isExpanded } = props;
  const { t } = useTranslation();

  const oracle = useOracleRollable(roll.oracleId ?? "");

  return (
    <>
      <RollTitle
        overline={roll.oracleCategoryName}
        title={oracle?.name ?? roll.rollLabel}
        isExpanded={isExpanded}
      />
      <RollContainer>
        <RollValues
          d10Results={roll.roll}
          isExpanded={isExpanded}
          cursedResult={roll.cursedDieRoll ?? undefined}
        />
        <RollResult
          markdown={roll.result}
          secondaryMarkdown={roll.cursedDieAdditiveResult ?? undefined}
          extras={
            roll.oracleId &&
            !!oracle?.match &&
            !Array.isArray(roll.roll) &&
            isOracleRollMatch(roll.roll)
              ? [t("datasworn.match", "Match")]
              : undefined
          }
        />
      </RollContainer>
    </>
  );
}
