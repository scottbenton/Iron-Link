import RollIcon from "@mui/icons-material/Casino";
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { getOracleTextFieldStrings } from "ui/game/OracleTextField/oracleTextFieldStrings";

import { useSetAnnouncement } from "stores/appState.store";

import { OracleTextFieldOracleConfig } from "./oracleTextFieldRoll";
import { useOracleTextFieldRoll } from "./useOracleTextFieldRoll";

export type { OracleTextFieldOracleConfig } from "./oracleTextFieldRoll";

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

  const { canRoll: doesOracleExist, roll } = useOracleTextFieldRoll(
    oracleId || oracleConfig,
  );

  // A roll that finds nothing still clears the field and is announced
  // (changes.md row 38 proposes the library's: leave it as it is).
  const handleOracleRoll = useCallback(() => {
    const value = roll() ?? "";
    onChange(value);
    announce(
      getOracleTextFieldStrings(t).updated(
        typeof label === "string" ? label : "",
        value,
      ),
    );
  }, [announce, label, roll, onChange, t]);

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
              <IconButton
                aria-label={
                  typeof label === "string"
                    ? t(
                        "datasworn.consult-the-oracle-for",
                        "Consult the Oracle for {{label}}",
                        { label },
                      )
                    : t("datasworn.consult-the-oracle", "Consult the Oracle")
                }
                onClick={() => handleOracleRoll()}
              >
                <RollIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
