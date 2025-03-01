import { Datasworn } from "@datasworn/core";
import delveJson from "@datasworn/ironsworn-classic-delve/json/delve.json";
import ironswornJson from "@datasworn/ironsworn-classic/json/classic.json";
import starforgedJson from "@datasworn/starforged/json/starforged.json";
import sunderedIslesJson from "@datasworn/sundered-isles/json/sundered_isles.json";
import { i18n } from "@/lib/i18n";
import { PlaysetConfig } from "@/repositories/game.repository";

const ironsworn = { ...ironswornJson, title: "Ironsworn" } as Datasworn.Ruleset;
const delve = {
  ...delveJson,
  title: "Delve",
} as unknown as Datasworn.Expansion;
const starforged = {
  ...starforgedJson,
  title: "Starforged",
} as unknown as Datasworn.Ruleset;
let sunderedIsles = sunderedIslesJson as Datasworn.Expansion;
sunderedIsles = JSON.parse(
  JSON.stringify(sunderedIsles),
) as Datasworn.Expansion;
sunderedIsles.moves.exploration.enhances = [
  "move_category:starforged/exploration",
];

export const ironswornId = ironswornJson._id;
export const delveId = delveJson._id;
export const starforgedId = starforgedJson._id;
export const sunderedIslesId = sunderedIslesJson._id;

export const defaultBaseRulesets: Record<string, Datasworn.Ruleset> = {
  [ironsworn._id]: ironsworn as Datasworn.Ruleset,
  [starforged._id]: starforged as unknown as Datasworn.Ruleset,
};

export const defaultExpansions: Record<
  string,
  Record<string, Datasworn.Expansion>
> = {
  [ironsworn._id]: {
    [delve._id]: { ...delve, title: "Delve" } as unknown as Datasworn.Expansion,
  },
  [starforged._id]: {
    [sunderedIsles._id]: sunderedIsles as Datasworn.Expansion,
  },
};

export const allDefaultPackages: Record<string, Datasworn.RulesPackage> = {
  [ironsworn._id]: ironsworn,
  [starforged._id]: starforged,
  [delve._id]: delve,
  [sunderedIsles._id]: sunderedIsles,
};

export const defaultPlaysets: Record<
  string,
  {
    info: string;
    playsets: {
      label: string;
      playset: PlaysetConfig;
    }[];
  }
> = {
  [sunderedIsles._id]: {
    info: i18n.t(
      "datasworn.default-playsets.sundered-isles-info",
      "Applies the recommended assets from Sundered Isles and Starforged to the base rulesets for either setting, based on the table in the Sundered Isles Guidebook.",
    ),
    playsets: [
      {
        label: i18n.t(
          "datasworn.default-playsets.starforged-with-sundered-isles-assets",
          "Starforged: Recommended",
        ),
        playset: {
          excludes: {
            assetCategories: {
              "asset_collection:sundered_isles/command_vehicle": true,
              "asset_collection:sundered_isles/support_vehicle": true,
              "asset_collection:sundered_isles/companion": true,
            },
            assets: {
              "asset:sundered_isles/module/chase_guns": true,
              "asset:sundered_isles/module/armored_prow": true,
              "asset:sundered_isles/module/harpoon_cannon": true,
              "asset:sundered_isles/module/improved_gunnery": true,
              "asset:sundered_isles/module/improved_hold": true,
              "asset:sundered_isles/module/improved_lookout": true,
              "asset:sundered_isles/module/improved_sick_bay": true,
              "asset:sundered_isles/module/ironclad_hull": true,
              "asset:sundered_isles/module/lucky_figurehead": true,
              "asset:sundered_isles/module/rigged_for_speed": true,
              "asset:sundered_isles/module/submersible_mode": true,
              "asset:sundered_isles/path/cannoneer": true,
              "asset:sundered_isles/path/harpooner": true,
              "asset:sundered_isles/path/musician": true,
              "asset:sundered_isles/path/musketeer": true,
              "asset:sundered_isles/path/peddler": true,
              "asset:sundered_isles/path/pistoleer": true,
              "asset:sundered_isles/path/scattershot": true,
              "asset:sundered_isles/path/scholar": true,
              "asset:sundered_isles/path/shipwright": true,
              "asset:sundered_isles/path/spy": true,
              "asset:sundered_isles/path/waterborn": true,
              "asset:sundered_isles/path/windbinder": true,
              "asset:sundered_isles/deed/old_salt": true,
            },
            moveCategories: {
              "move_category:sundered_isles/exploration": true,
              "move_category:sundered_isles/combat": true,
              "move_category:sundered_isles/suffer": true,
              "move_category:sundered_isles/recover": true,
            },
            moves: {},
            oracleCategories: {
              "oracle_collection:sundered_isles/adventures": true,
              "oracle_collection:sundered_isles/cave": true,
              "oracle_collection:sundered_isles/character": true,
              "oracle_collection:sundered_isles/core": true,
              "oracle_collection:sundered_isles/faction": true,
              "oracle_collection:sundered_isles/getting_underway": true,
              "oracle_collection:sundered_isles/island": true,
              "oracle_collection:sundered_isles/misc": true,
              "oracle_collection:sundered_isles/overland": true,
              "oracle_collection:sundered_isles/ruin": true,
              "oracle_collection:sundered_isles/seafaring": true,
              "oracle_collection:sundered_isles/settlement": true,
              "oracle_collection:sundered_isles/ship": true,
              "oracle_collection:sundered_isles/shipwreck": true,
              "oracle_collection:sundered_isles/treasure": true,
              "oracle_collection:sundered_isles/weather": true,
            },
            oracles: {},
          },
        },
      },
      {
        label: i18n.t(
          "datasworn.default-playsets.sundered-isles-with-starforged-assets",
          "Sundered Isles: Recommended",
        ),
        playset: {
          excludes: {
            assetCategories: {},
            assets: {
              "asset:starforged/command_vehicle/starship": true,
              "asset:starforged/companion/banshee": true,
              "asset:starforged/companion/combat_bot": true,
              "asset:starforged/companion/glowcat": true,
              "asset:starforged/companion/protocol_bot": true,
              "asset:starforged/companion/rockhorn": true,
              "asset:starforged/companion/sidekick": true,
              "asset:starforged/companion/sprite": true,
              "asset:starforged/companion/survey_bot": true,
              "asset:starforged/companion/symbiote": true,
              "asset:starforged/companion/utility_bot": true,
              "asset:starforged/companion/voidglider": true,
              "asset:starforged/deed/marked": true,
              "asset:starforged/module/engine_upgrade": true,
              "asset:starforged/module/expanded_hold": true,
              "asset:starforged/module/grappler": true,
              "asset:starforged/module/heavy_cannons": true,
              "asset:starforged/module/internal_refit": true,
              "asset:starforged/module/medbay": true,
              "asset:starforged/module/missile_array": true,
              "asset:starforged/module/overseer": true,
              "asset:starforged/module/reinforced_hull": true,
              "asset:starforged/module/research_lab": true,
              "asset:starforged/module/sensor_array": true,
              "asset:starforged/module/shields": true,
              "asset:starforged/module/stealth_tech": true,
              "asset:starforged/module/vehicle_bay": true,
              "asset:starforged/module/workshop": true,
              "asset:starforged/path/ace": true,
              "asset:starforged/path/archer": true,
              "asset:starforged/path/artist": true,
              "asset:starforged/path/explorer": true,
              "asset:starforged/path/gunner": true,
              "asset:starforged/path/gunslinger": true,
              "asset:starforged/path/infiltrator": true,
              "asset:starforged/path/looper": true,
              "asset:starforged/path/lore_hunter": true,
              "asset:starforged/path/naturalist": true,
              "asset:starforged/path/sniper": true,
              "asset:starforged/path/tech": true,
              "asset:starforged/path/trader": true,
              "asset:starforged/path/voidborn": true,
              "asset:starforged/path/weapon_master": true,
              "asset:starforged/support_vehicle/exosuit": true,
              "asset:starforged/support_vehicle/hoverbike": true,
              "asset:starforged/support_vehicle/rover": true,
              "asset:starforged/support_vehicle/service_pod": true,
              "asset:starforged/support_vehicle/shuttle": true,
              "asset:starforged/support_vehicle/skiff": true,
              "asset:starforged/support_vehicle/snub_fighter": true,
            },
            moveCategories: {},
            moves: {},
            oracleCategories: {},
            oracles: {},
          },
        },
      },
    ],
  },
};
