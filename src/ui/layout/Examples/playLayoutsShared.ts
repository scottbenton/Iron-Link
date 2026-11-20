import { css } from "styled-system/css";

import { sampleCharacters } from "../../docs/fixtures/characters";

/* ------------------------------------------------------------------------ */
/* State shared by every proposal                                           */
/* ------------------------------------------------------------------------ */

export const character = sampleCharacters[0];

export const meterKeys = ["health", "spirit", "supply"] as const;

export const legacyTracks = [
  { key: "quests", label: "Quests", ticks: 14 },
  { key: "bonds", label: "Bonds", ticks: 6 },
  { key: "discoveries", label: "Discoveries", ticks: 9 },
];

export const stackStyles = css({ display: "grid", gap: "3", minWidth: 0 });

/* ------------------------------------------------------------------------ */
/* Reference and log                                                        */
/* ------------------------------------------------------------------------ */

export const openCategoryIds = new Set([
  "move_category:starforged/adventure",
  "move_category:starforged/combat",
  "oracle_collection:starforged/core",
]);

export const treeStyles = css({ display: "grid", gap: "2", minWidth: 0 });
