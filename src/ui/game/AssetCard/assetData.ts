import type { Datasworn } from "@datasworn-community/core";

/** What a character has done with an asset, as Iron Link stores it. */
export interface AssetCardState {
  /** Abilities ticked beyond those enabled by default, by index. */
  enabledAbilities?: Record<number, boolean> | boolean[];
  /** Values of meters, checkboxes, clocks and the like, by control key. */
  controlValues?: Record<string, boolean | string | number>;
  /** Values of the asset's fields (name, chosen stat), by option key. */
  optionValues?: Record<string, string>;
}

export type AssetControl =
  | Datasworn.AssetControlField
  | Datasworn.AssetAbilityControlField;
export type AssetOption =
  | Datasworn.AssetOptionField
  | Datasworn.AssetAbilityOptionField;
export type AssetControlValue = boolean | string | number;

export function isAbilityEnabled(
  asset: Datasworn.Asset,
  state: AssetCardState | undefined,
  index: number,
): boolean {
  const ability = asset.abilities[index];
  if (!ability) return false;
  const enabled = state?.enabledAbilities as
    | Record<number, boolean>
    | undefined;
  return ability.enabled || !!enabled?.[index];
}

/**
 * The asset's fields and controls once its enabled abilities are counted:
 * abilities can add controls (a clock, a counter), add options, and enhance
 * the asset's own controls (a higher max on a meter).
 */
export function getAssetFields(
  asset: Datasworn.Asset,
  state?: AssetCardState,
): {
  controls: Record<string, AssetControl>;
  options: Record<string, AssetOption>;
} {
  const controls: Record<string, AssetControl> = { ...asset.controls };
  const options: Record<string, AssetOption> = { ...asset.options };

  asset.abilities.forEach((ability, index) => {
    if (!isAbilityEnabled(asset, state, index)) return;
    Object.assign(controls, ability.controls ?? {});
    Object.assign(options, ability.options ?? {});

    const enhanced = ability.enhance_asset?.controls ?? {};
    Object.entries(enhanced).forEach(([key, enhancement]) => {
      const control = controls[key];
      if (control && control.field_type === enhancement.field_type) {
        controls[key] = {
          ...control,
          ...(enhancement as Partial<AssetControl>),
        } as AssetControl;
      }
    });
  });

  return { controls, options };
}

/** A control's current value, or its default. */
export function getControlValue(
  control: AssetControl | Datasworn.AssetConditionMeterControlField,
  key: string,
  state?: AssetCardState,
): AssetControlValue | undefined {
  const stored = state?.controlValues?.[key];
  if (stored !== undefined) return stored;
  return (control as { value?: AssetControlValue | null }).value ?? undefined;
}

/**
 * The marked toggles that put the asset out of use, such as a module's
 * Broken or a companion's Out of Action, with their labels.
 */
export function getDisablingMarks(
  controls: Record<string, AssetControl>,
  state?: AssetCardState,
): string[] {
  const marks: string[] = [];
  const check = (
    key: string,
    control: AssetControl | Datasworn.AssetConditionMeterControlField,
  ) => {
    if (
      (control.field_type === "checkbox" ||
        control.field_type === "card_flip") &&
      control.disables_asset &&
      getControlValue(control, key, state) === true
    ) {
      marks.push(capitalize(control.label));
    }
  };
  Object.entries(controls).forEach(([key, control]) => {
    check(key, control);
    if (control.field_type === "condition_meter") {
      Object.entries(control.controls ?? {}).forEach(([subKey, sub]) =>
        check(subKey, sub),
      );
    }
  });
  return marks;
}

/** Sorted by label, as Iron Link lists them. */
export function sortByLabel<T extends { label: string }>(
  record: Record<string, T>,
): [string, T][] {
  return Object.entries(record).sort(([, a], [, b]) =>
    a.label.localeCompare(b.label),
  );
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
