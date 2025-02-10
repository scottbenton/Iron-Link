import RollIcon from "@mui/icons-material/Casino";
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getOracleCollection } from "hooks/datasworn/useOracleCollection";
import { getOracleRollable } from "hooks/datasworn/useOracleRollable";
import { useRollOracle } from "hooks/useRollOracle";

import { useSetAnnouncement } from "stores/appState.store";

import { IOracleTableRoll } from "services/gameLog.service";

export type OracleTextFieldOracleConfig = {
  tableIds: (string | OracleTextFieldOracleConfig)[];
  joinTables?: boolean;
  joinSeparator?: string;
};

export type OracleTextFieldProps = Omit<TextFieldProps, "onChange"> & {
  value?: string;
  oracleId?: string;
  oracleConfig?: OracleTextFieldOracleConfig;
  onChange: (value: string) => void;
};

export function OracleTextField(props: OracleTextFieldProps) {
  const { oracleId, oracleConfig, onChange, label, ...textFieldProps } = props;

  const { t } = useTranslation();
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

  return (
    <TextField
      label={label}
      fullWidth
      {...textFieldProps}
      onChange={(evt) => onChange(evt.currentTarget.value)}
      InputProps={{
        endAdornment: doesOracleExist ? (
          <InputAdornment position={"end"}>
            <Tooltip
              title={t("datasworn.consult-the-oracle", "Consult the Oracle")}
              enterDelay={500}
            >
              <IconButton onClick={() => handleOracleRoll()}>
                <RollIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined,
      }}
    />
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
