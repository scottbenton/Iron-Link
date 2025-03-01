import { Field, FieldProps } from "@/components/common/TextField";
import { getOracleCollection } from "@/hooks/datasworn/useOracleCollection";
import { getOracleRollable } from "@/hooks/datasworn/useOracleRollable";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useRollOracle } from "@/hooks/useRollOracle";
import { IOracleTableRoll } from "@/services/gameLog.service";
import { useSetAnnouncement } from "@/stores/appState.store";
import { Group, IconButton, Input, InputAddon } from "@chakra-ui/react";
import { Dices } from "lucide-react";
import { ChangeEvent, useCallback, useMemo } from "react";

export type OracleTextFieldOracleConfig = {
  tableIds: (string | OracleTextFieldOracleConfig)[];
  joinTables?: boolean;
  joinSeparator?: string;
};

export type OracleTextFieldProps = FieldProps & {
  value?: string;
  oracleId?: string;
  oracleConfig?: OracleTextFieldOracleConfig;
  onChange: (value: string) => void;
};

export function OracleTextField(props: OracleTextFieldProps) {
  const { oracleId, oracleConfig, onChange, label, value, ...fieldProps } =
    props;

  const t = useDataswornTranslations();

  const announce = useSetAnnouncement();

  const doesOracleExist = useMemo(() => {
    return checkIfAtLeastOneOracleExists(oracleId, oracleConfig);
  }, [oracleId, oracleConfig]);

  const getOracleResult = useRollOracle();

  const handleOracleRoll = useCallback(() => {
    let value = "";
    if (oracleId || oracleConfig) {
      value = rollOracle(oracleId ?? oracleConfig, getOracleResult);
    }
    onChange(value);
    announce(`Updated ${label} to ${value}`);
  }, [announce, label, oracleId, oracleConfig, getOracleResult, onChange]);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      onChange(evt.target.value);
    },
    [onChange],
  );

  return (
    <Field label={label} {...fieldProps}>
      <Group attached={doesOracleExist}>
        <Input value={value} onChange={handleChange} />
        {doesOracleExist && (
          <InputAddon p={0}>
            <IconButton
              colorPalette="gray"
              variant="subtle"
              size="sm"
              rounded="inherit"
              aria-label={t(
                "consult-the-oracle-text-field-button",
                "Consult the Oracle",
              )}
              onClick={handleOracleRoll}
            >
              <Dices />
            </IconButton>
          </InputAddon>
        )}
      </Group>
    </Field>
  );
}

function checkIfAtLeastOneOracleExists(
  oracleId: string | undefined,
  oracleConfig: OracleTextFieldOracleConfig | undefined,
): boolean {
  if (oracleId) {
    const oracle = getOracleRollable(oracleId) ?? getOracleCollection(oracleId);
    return !!oracle;
  } else if (oracleConfig) {
    for (const tableId of oracleConfig.tableIds) {
      if (typeof tableId === "string") {
        if (getOracleRollable(tableId) || getOracleCollection(tableId)) {
          return true;
        }
      } else {
        if (checkIfAtLeastOneOracleExists(undefined, tableId)) {
          return true;
        }
      }
    }
  }
  return false;
}

function rollOracle(
  oracle: string | OracleTextFieldOracleConfig | undefined,
  getOracleResult: (oracleId: string) => IOracleTableRoll | undefined,
): string {
  if (!oracle) return "";
  if (typeof oracle === "string") {
    const result = getOracleResult(oracle);
    return result?.result ?? "";
  } else {
    if (oracle.joinTables) {
      // Roll each and join results
      return oracle.tableIds
        .map((tableId) => rollOracle(tableId, getOracleResult))
        .join(oracle.joinSeparator ?? " ");
    } else {
      const oracleIndex = Math.floor(Math.random() * oracle.tableIds.length);
      const subOracle = oracle.tableIds[oracleIndex];
      return rollOracle(subOracle, getOracleResult);
    }
  }
}
