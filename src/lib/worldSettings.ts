import { getOrderedPackageConfigs } from "data/package.config";

import { WorldOption, worldOptions } from "lib/worldOptions";

// A single card in the world creation picker. Every datasworn world option
// becomes one of these, plus the synthetic "blank world" option that creates a
// world with no setting at all.
export interface WorldCreationOption {
  // Stable identity for selection; equal to the setting key when there is one.
  id: string;
  name: string;
  description?: string;
  // What ends up in worlds.setting_key: a datasworn world id, a bare package
  // id for packages that ship truths but no worlds, or null for a blank world.
  settingKey: string | null;
  // Name prefilled into the world name field when this option is picked. Null
  // when the option has no meaningful default name.
  prefillName: string | null;
  // The rules package the setting comes from, shown under the name so
  // "The Sundered Isles" is identifiable as the Sundered Isles expansion.
  // Undefined for the blank world, and for truths-only packages whose option
  // name is already the package name.
  packageName?: string;
}

export const blankWorldOptionId = "blank-world";

// worlds.setting_key for a datasworn world option: the world id when the
// package ships curated worlds, otherwise the package id itself.
export function getSettingKeyForWorldOption(option: WorldOption): string {
  return option.kind === "world" ? option.worldId : option.packageId;
}

// The setting-backed half of the picker. The blank world option is added by
// the form, which owns its translated strings.
export function getWorldSettingCreationOptions(): WorldCreationOption[] {
  const packageNames = getPackageDisplayNames();

  return worldOptions.map((option) => {
    const settingKey = getSettingKeyForWorldOption(option);
    return {
      id: settingKey,
      name: option.name,
      settingKey,
      prefillName: option.name,
      // A "package" option is already named after its package; repeating it
      // underneath would just be the same words twice.
      packageName:
        option.kind === "world" ? packageNames[option.packageId] : undefined,
    };
  });
}

// packageId -> the human-facing name from package.config.ts ("Ironsworn",
// "Sundered Isles"), which is where display names live -- the package JSON
// carries ids and titles that do not always match what the app calls them.
function getPackageDisplayNames(): Record<string, string> {
  return Object.fromEntries(
    getOrderedPackageConfigs().map((config) => [config.id, config.name]),
  );
}

// Resolves a stored setting key back to the label shown in the UI. Returns the
// raw key for settings we no longer recognize (a package that was removed, or
// a world created by a newer client) so the value is never silently hidden.
export function getWorldSettingLabel(settingKey: string): string {
  const match = worldOptions.find(
    (option) => getSettingKeyForWorldOption(option) === settingKey,
  );
  return match?.name ?? settingKey;
}
