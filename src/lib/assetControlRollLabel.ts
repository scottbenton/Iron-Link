import type { TFunction } from "i18next";

import { capitalize } from "ui/game/shared";

/**
 * What a roll of an asset's control is called, wherever it is rolled from
 * (the asset card or a move): "Hoverbike's Integrity". Datasworn names
 * controls in lower case, so the control is capitalized.
 */
export function getAssetControlRollLabel(
  t: TFunction,
  assetName: string,
  controlLabel: string,
): string {
  return t(
    "datasworn.move.asset-control-roll-label",
    "{{assetName}}'s {{controlLabel}}",
    {
      assetName,
      controlLabel: capitalize(controlLabel),
    },
  );
}
