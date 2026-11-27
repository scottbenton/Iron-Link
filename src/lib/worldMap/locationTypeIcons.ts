import { IconColors, RequiredIconDefinition } from "types/Icon.type";

// Pin icons for the Location Type options in the built-in templates, from
// Iron Fellowship's location configs. A type is matched by name, ignoring
// case, so imported and hand-typed values work too.
const LOCATION_TYPE_ICONS: Record<string, RequiredIconDefinition> = {
  settlement: { key: "GiVikingLonghouse", color: IconColors.Brown },
  tower: { key: "GiStoneTower", color: IconColors.Grey },
  ruin: { key: "GiBrokenWall", color: IconColors.Grey },
  camp: { key: "GiCampfire", color: IconColors.Orange },
  sector: { key: "GiSolarSystem", color: IconColors.White },
  planet: { key: "GiWorld", color: IconColors.Green },
  star: { key: "GiPolarStar", color: IconColors.Yellow },
  derelict: { key: "GiFragmentedMeteor", color: IconColors.Orange },
  vault: { key: "GiMartyrMemorial", color: IconColors.Purple },
  area: { key: "GiTreasureMap", color: IconColors.Brown },
  island: { key: "GiIsland", color: IconColors.Green },
  shipwreck: { key: "GiShipWreck", color: IconColors.Brown },
  cave: { key: "GiCaveEntrance", color: IconColors.Grey },
};

// A setting's own icon for a type, where the shared one would look wrong
// there: a Forge settlement is a station, not a longhouse. Keyed by the
// world's setting_key; everything else uses the shared table.
const SETTING_LOCATION_TYPE_ICONS: Record<
  string,
  Record<string, RequiredIconDefinition>
> = {
  "world:starforged/forge": {
    settlement: { key: "GiDefenseSatellite", color: IconColors.Grey },
  },
  "world:sundered_isles/sundered_isles": {
    settlement: { key: "GiMedievalVillage01", color: IconColors.Grey },
  },
};

export function getLocationTypeIcon(
  type: string | undefined,
  settingKey?: string | null,
): RequiredIconDefinition | undefined {
  if (!type) return undefined;
  const name = type.trim().toLowerCase();
  const icons = {
    ...LOCATION_TYPE_ICONS,
    ...(settingKey ? SETTING_LOCATION_TYPE_ICONS[settingKey] : undefined),
  };
  return (
    icons[name] ??
    // "Planetside Settlement", "Orbital settlement" and the like.
    Object.entries(icons).find(([key]) => name.includes(key))?.[1]
  );
}
