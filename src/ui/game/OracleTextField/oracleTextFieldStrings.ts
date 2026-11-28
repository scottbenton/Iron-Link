import type { TFunction } from "i18next";

/** The words an oracle text field uses. */
export interface OracleTextFieldStrings {
  /** The roll button's name and tooltip: "Roll Settlement Name". */
  roll: (oracle: string) => string;
  /** Announced after a roll: "Updated Name to Kai". */
  updated: (name: string, result: string) => string;
}

export function getOracleTextFieldStrings(
  t: TFunction,
): OracleTextFieldStrings {
  return {
    roll: (oracle) =>
      t("ui.oracle-text-field.roll", "Roll {{oracle}}", { oracle }),
    updated: (name, result) =>
      t("ui.oracle-text-field.updated", "Updated {{name}} to {{result}}", {
        name,
        result,
      }),
  };
}
