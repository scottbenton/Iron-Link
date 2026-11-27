import {
  GROUPS_CATEGORY_ICON_KEY,
  MAP_CATEGORY_ICON_KEY,
  categoryIconName,
  getCanonicalCategoryIconKey,
} from "./categoryIcons";

// The icon picker's order. Nothing is ever left out: a curated shortlist of
// worldbuilding icons comes first (the group that fits the category leading),
// then icons already used in the world, then every other icon by name.
// Search keeps that order of sections and puts better matches first in each.

export type IconShortlistGroup =
  | "places"
  | "people"
  | "factions"
  | "lore"
  | "sea"
  | "space";

export const ICON_SHORTLIST_GROUPS: IconShortlistGroup[] = [
  "places",
  "people",
  "factions",
  "lore",
  "sea",
  "space",
];

// Each key is listed in one group only. A test checks every key is in the
// loaded icon set, so a renamed or removed icon fails there.
export const ICON_SHORTLIST: Record<IconShortlistGroup, string[]> = {
  places: [
    MAP_CATEGORY_ICON_KEY,
    "GiVikingLonghouse",
    "GiMedievalVillage01",
    "GiVillage",
    "GiModernCity",
    "GiCastle",
    "GiCastleRuins",
    "GiStoneTower",
    "GiWatchtower",
    "GiClockTower",
    "GiHillFort",
    "GiMilitaryFort",
    "GiBrokenWall",
    "GiAncientRuins",
    "GiCampfire",
    "GiDesertCamp",
    "GiCampingTent",
    "GiWoodCabin",
    "GiTipi",
    "GiCaveEntrance",
    "GiMountainCave",
    "GiMountains",
    "GiMountainRoad",
    "GiForest",
    "GiPineTree",
    "GiSwamp",
    "GiDesert",
    "GiRiver",
    "GiStoneBridge",
    "GiMedievalGate",
    "GiDungeonGate",
    "GiPortal",
    "GiMining",
    "GiWindmill",
    "GiBarn",
    "GiChurch",
    "GiGreekTemple",
    "GiFireShrine",
    "GiCrystalShrine",
    "GiObelisk",
    "GiGraveyard",
    "GiCryptEntrance",
    "GiTavernSign",
    "GiShop",
    "GiDirectionSigns",
    "GiTreasureMap",
    "GiCompass",
  ],
  people: [
    GROUPS_CATEGORY_ICON_KEY,
    "GiPerson",
    "GiHoodedFigure",
    "GiCowled",
    "GiHoodedAssassin",
    "GiSwordman",
    "GiSwordwoman",
    "GiWomanElfFace",
    "GiDwarfFace",
    "GiWizardFace",
    "GiWitchFace",
    "GiCultist",
    "GiBandit",
    "GiMonkFace",
    "GiSunPriest",
    "GiCrownedSkull",
    "GiKnightBanner",
    "GiVisoredHelm",
    "GiPirateCaptain",
    "GiAstronautHelmet",
    "GiAndroidMask",
    "GiCyborgFace",
    "GiAlienStare",
    "GiGoblin",
    "GiTroll",
    "GiOgre",
    "GiWolfHead",
    "GiRaven",
    "GiDragonHead",
    "GiSpectre",
    "GiVampireDracula",
    "GiOrcHead",
  ],
  factions: [
    "GiBlackFlag",
    "GiTatteredBanner",
    "GiVerticalBanner",
    "GiFlagObjective",
    "GiCrossedSwords",
    "GiShield",
    "GiSwordsEmblem",
    "GiEagleEmblem",
    "GiTribalMask",
    "GiWaxSeal",
    "GiTwoCoins",
    "GiChest",
    "GiRing",
    "GiCog",
  ],
  lore: [
    "GiBookmarklet",
    "GiBookCover",
    "GiOpenBook",
    "GiSpellBook",
    "GiScrollUnfurled",
    "GiQuillInk",
    "GiRuneStone",
    "GiCrystalBall",
    "GiMagicSwirl",
    "GiMoon",
    "GiSun",
    "GiOrrery",
    "GiHourglass",
    "GiHolyGrail",
    "GiFamilyTree",
    "GiBubblingFlask",
    "GiKey",
    "GiPendantKey",
    "GiLockedChest",
    "GiPentacle",
  ],
  sea: [
    "GiGalleon",
    "GiSailboat",
    "GiFishingBoat",
    "GiPirateFlag",
    "GiShipWreck",
    "GiIsland",
    "GiPalmTree",
    "GiAnchor",
    "GiShipWheel",
    "GiOctopus",
    "GiKrakenTentacle",
    "GiSeaSerpent",
    "GiWhaleTail",
    "GiWaveCrest",
    "GiBigWave",
    "GiSpyglass",
    "GiLighthouse",
    "GiHarborDock",
    "GiSeaDragon",
  ],
  space: [
    "GiSolarSystem",
    "GiRingedPlanet",
    "GiWorld",
    "GiPlanetCore",
    "GiPolarStar",
    "GiStarSatellites",
    "GiSatellite",
    "GiDefenseSatellite",
    "GiSpaceship",
    "GiRocket",
    "GiUfo",
    "GiStarGate",
    "GiBlackHoleBolas",
    "GiGalaxy",
    "GiAsteroid",
    "GiFragmentedMeteor",
    "GiCometSpark",
    "GiAlienSkull",
    "GiRobotAntennas",
    "GiCryoChamber",
    "GiMartyrMemorial",
  ],
};

// Words people type that the shortlist icons' names don't say. A query that
// starts one of these words (or is one) finds its icons as a prefix match.
const ICON_SHORTLIST_SYNONYMS: Record<string, string[]> = {
  town: [
    "GiVillage",
    "GiMedievalVillage01",
    "GiVikingLonghouse",
    "GiModernCity",
    "GiCastle",
  ],
  city: ["GiModernCity", "GiMedievalVillage01", "GiCastle", "GiVillage"],
  settlement: [
    "GiVikingLonghouse",
    "GiMedievalVillage01",
    "GiVillage",
    "GiModernCity",
    "GiDefenseSatellite",
  ],
  station: ["GiDefenseSatellite", "GiSatellite", "GiStarSatellites"],
  fort: ["GiCastle", "GiHillFort", "GiMilitaryFort", "GiStoneTower"],
  ruin: ["GiCastleRuins", "GiAncientRuins", "GiBrokenWall"],
  temple: ["GiGreekTemple", "GiChurch", "GiFireShrine", "GiCrystalShrine"],
  grave: ["GiGraveyard", "GiCryptEntrance"],
  cemetery: ["GiGraveyard", "GiCryptEntrance"],
  inn: ["GiTavernSign"],
  road: ["GiMountainRoad", "GiDirectionSigns"],
  path: ["GiMountainRoad", "GiDirectionSigns"],
  map: [MAP_CATEGORY_ICON_KEY, "GiTreasureMap"],
  npc: [GROUPS_CATEGORY_ICON_KEY, "GiPerson", "GiHoodedFigure"],
  character: [GROUPS_CATEGORY_ICON_KEY, "GiPerson", "GiHoodedFigure"],
  people: [GROUPS_CATEGORY_ICON_KEY, "GiPerson"],
  monster: ["GiGoblin", "GiTroll", "GiOgre", "GiDragonHead", "GiSeaSerpent"],
  faction: ["GiBlackFlag", "GiTatteredBanner", "GiVerticalBanner"],
  guild: ["GiBlackFlag", "GiVerticalBanner", "GiEagleEmblem", "GiWaxSeal"],
  clan: ["GiTatteredBanner", "GiTribalMask", "GiWolfHead"],
  trade: ["GiTwoCoins", "GiChest", "GiShop"],
  money: ["GiTwoCoins", "GiChest"],
  history: ["GiBookmarklet", "GiBookCover", "GiOpenBook", "GiScrollUnfurled"],
  magic: ["GiSpellBook", "GiMagicSwirl", "GiCrystalBall", "GiPentacle"],
  ship: ["GiGalleon", "GiSailboat", "GiFishingBoat", "GiSpaceship"],
  boat: ["GiGalleon", "GiSailboat", "GiFishingBoat"],
  pirate: ["GiPirateFlag", "GiPirateCaptain"],
  port: ["GiHarborDock", "GiLighthouse", "GiAnchor"],
  wreck: ["GiShipWreck", "GiFragmentedMeteor"],
  derelict: ["GiFragmentedMeteor", "GiShipWreck"],
  planet: ["GiRingedPlanet", "GiWorld", "GiPlanetCore"],
  star: ["GiPolarStar", "GiStarSatellites"],
  vault: ["GiMartyrMemorial", "GiLockedChest"],
};

// Synonyms by their canonical key, so the test can check them too.
export function getIconShortlistSynonymKeys(): string[] {
  return [...new Set(Object.values(ICON_SHORTLIST_SYNONYMS).flat())];
}

export interface IconPickerCategory {
  name: string;
  supportsMap: boolean;
  supportsBonds: boolean;
}

// The settings whose places are mostly at sea or in space.
const SETTING_GROUPS: Record<string, IconShortlistGroup> = {
  "world:starforged/forge": "space",
  "world:sundered_isles/sundered_isles": "sea",
};

// Which shortlist groups fit a category, best first. Categories have no
// stored kind, so this reads its name and what it supports: the defaults
// are Locations (with a map), NPCs (with bonds), Factions and Lore.
export function getIconShortlistGroupOrder(
  category: IconPickerCategory | null | undefined,
  settingKey: string | null | undefined,
): IconShortlistGroup[] {
  const name = category?.name.toLowerCase() ?? "";
  const fits: IconShortlistGroup[] = [];
  const places =
    !!category?.supportsMap ||
    /locat|place|region|site|area|planet|island|map|realm/.test(name);
  if (places) fits.push("places");
  if (
    /npc|people|person|character|crew|cast|folk|contact/.test(name) ||
    (!!category?.supportsBonds && !places)
  )
    fits.push("people");
  if (/faction|guild|house|clan|order|organi[sz]ation|power/.test(name))
    fits.push("factions");
  if (/lore|histor|legend|myth|relig|god|truth|knowledge/.test(name))
    fits.push("lore");
  const settingGroup = settingKey ? SETTING_GROUPS[settingKey] : undefined;
  // A setting's own group follows places (its locations are planets or
  // islands), or leads where nothing else fits.
  const order: IconShortlistGroup[] = [];
  for (const group of fits) {
    order.push(group);
    if (group === "places" && settingGroup) order.push(settingGroup);
  }
  if (settingGroup) order.push(settingGroup);
  order.push(...ICON_SHORTLIST_GROUPS);
  return [...new Set(order)];
}

export type IconPickerSectionId =
  | "current"
  | IconShortlistGroup
  | "world"
  | "all";

export interface IconPickerSection {
  id: IconPickerSectionId;
  keys: string[];
}

// 0 the whole name, 1 a whole word, 2 the start of a word (or a synonym),
// 3 anywhere else; undefined when the icon doesn't match.
function getMatchRank(key: string, query: string): number | undefined {
  if (!query) return 0;
  const name = categoryIconName(key).toLowerCase();
  if (name === query) return 0;
  const padded = ` ${name} `;
  if (padded.includes(` ${query} `)) return 1;
  if (padded.includes(` ${query}`)) return 2;
  const canonical = getCanonicalCategoryIconKey(key);
  for (const [word, keys] of Object.entries(ICON_SHORTLIST_SYNONYMS)) {
    if (word.startsWith(query) && keys.includes(canonical)) return 2;
  }
  if (name.includes(query)) return 3;
  return undefined;
}

// The picker's sections in order, each key once (the first section that has
// it), with empty sections left out. allKeys is every icon the picker offers;
// worldKeys are the stored keys of icons in use in the world, most used
// first. Without a query every icon is listed.
export function getIconPickerSections({
  allKeys,
  initialKey,
  groupOrder,
  worldKeys,
  query,
}: {
  allKeys: string[];
  initialKey: string | null;
  groupOrder: IconShortlistGroup[];
  worldKeys: string[];
  query: string;
}): IconPickerSection[] {
  const offered = new Set(allKeys);
  const seen = new Set<string>();
  const take = (keys: string[]) => {
    const kept: string[] = [];
    for (const key of keys) {
      const canonical = getCanonicalCategoryIconKey(key);
      if (!offered.has(canonical) || seen.has(canonical)) continue;
      seen.add(canonical);
      kept.push(key);
    }
    return kept;
  };
  const sections: IconPickerSection[] = [
    { id: "current", keys: take(initialKey ? [initialKey] : []) },
    ...groupOrder.map((group) => ({
      id: group,
      keys: take(ICON_SHORTLIST[group]),
    })),
    { id: "world", keys: take(worldKeys) },
    {
      id: "all",
      keys: take(
        [...allKeys].sort((a, b) =>
          categoryIconName(a).localeCompare(categoryIconName(b)),
        ),
      ),
    },
  ];
  return sections
    .map(({ id, keys }) => {
      const ranked = keys
        .map((key, index) => ({ key, index, rank: getMatchRank(key, query) }))
        .filter(
          (item): item is typeof item & { rank: number } =>
            item.rank !== undefined,
        )
        .sort((a, b) => a.rank - b.rank || a.index - b.index);
      return { id, keys: ranked.map(({ key }) => key) };
    })
    .filter(({ keys }) => keys.length > 0);
}

// Stored icon keys in use in a world, most used first, then by name.
export function getWorldIconKeys(
  icons: (string | null | undefined)[],
): string[] {
  const counts = new Map<string, number>();
  for (const key of icons) {
    if (!key) continue;
    const canonical = getCanonicalCategoryIconKey(key);
    counts.set(canonical, (counts.get(canonical) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(
      ([a, countA], [b, countB]) =>
        countB - countA ||
        categoryIconName(a).localeCompare(categoryIconName(b)),
    )
    .map(([key]) => key);
}
