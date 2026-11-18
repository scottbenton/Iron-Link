/**
 * Sample tracks for stories. Story-only: imports the rules fixtures, so
 * nothing in the app may import it.
 */
import { classicMove, starforgedMove } from "../../stories/fixtures/datasworn";
import type {
  BondItem,
  ConnectionItem,
  ProgressTrackKind,
  TrackItem,
  TrackMove,
} from "./tracksPanelTypes";

const move = (data: { _id: string; name: string }): TrackMove => ({
  id: data._id,
  name: data.name,
});

/** Starforged's completion moves, as the live app picks them by rules. */
export const starforgedCompletionMoves: Partial<
  Record<ProgressTrackKind, TrackMove[]>
> = {
  vow: [move(starforgedMove("quest", "fulfill_your_vow"))],
  journey: [move(starforgedMove("exploration", "finish_an_expedition"))],
  combat: [move(starforgedMove("combat", "take_decisive_action"))],
  sceneChallenge: [move(starforgedMove("scene_challenge", "finish_the_scene"))],
};

export const classicCompletionMoves: Partial<
  Record<ProgressTrackKind, TrackMove[]>
> = {
  vow: [move(classicMove("quest", "fulfill_your_vow"))],
  journey: [move(classicMove("adventure", "reach_your_destination"))],
  combat: [move(classicMove("combat", "end_the_fight"))],
};

export const starforgedConnectionMoves: TrackMove[] = [
  move(starforgedMove("connection", "forge_a_bond")),
];

/** Kira's game in the Drowned Archive, newest first as the live app sorts. */
export const sampleTracks: TrackItem[] = [
  {
    id: "flood-gates",
    kind: "sceneChallenge",
    label: "Talk the dock guild into opening the flood gates",
    rank: "dangerous",
    ticks: 8,
    tension: 1,
  },
  {
    id: "archive-floods",
    kind: "clock",
    label: "The archive floods",
    description: "Advance when you Pay the Price inside the archive.",
    segments: 6,
    value: 2,
    odds: "likely",
  },
  {
    id: "salvagers",
    kind: "combat",
    label: "Drive off the salvagers at the Drowned Archive",
    rank: "troublesome",
    ticks: 20,
  },
  {
    id: "bleakhold",
    kind: "journey",
    label: "Cross the Shattered Reach to Bleakhold",
    rank: "dangerous",
    ticks: 16,
    description: "Through the drift, before the relay goes dark.",
  },
  {
    id: "salvager-patience",
    kind: "clock",
    label: "The salvagers' patience runs out",
    segments: 4,
    value: 4,
    completed: true,
  },
  {
    id: "hollow-crown",
    kind: "vow",
    label: "Recover the Hollow Crown",
    rank: "formidable",
    ticks: 12,
    description: "Sworn at the gates of Thornhold, before the elders.",
  },
  {
    id: "courier",
    kind: "vow",
    label: "Find the missing courier",
    rank: "dangerous",
    ticks: 40,
    completed: true,
  },
  {
    id: "lost-fleet",
    kind: "vow",
    label: "Find the Lost Fleet of the Exodus",
    rank: "epic",
    ticks: 7,
    description: "Kira's background vow.",
  },
];

/** A long game: many tracks of every kind, a few completed. */
export const manySampleTracks: TrackItem[] = [
  ...sampleTracks,
  {
    id: "iron-prophet",
    kind: "vow",
    label: "Unmask the Iron Prophet before the Havens of Ashfall fall",
    rank: "extreme",
    ticks: 6,
  },
  {
    id: "long-winter",
    kind: "clock",
    label: "The Long Winter",
    description: "Advance at the end of each session.",
    segments: 10,
    value: 3,
    odds: "fiftyFifty",
  },
  {
    id: "wyvern",
    kind: "journey",
    label: "Track the wyvern to its roost",
    rank: "extreme",
    ticks: 11,
  },
  {
    id: "blood-raider",
    kind: "combat",
    label: "Duel with the Blood Raider",
    rank: "formidable",
    ticks: 8,
  },
  {
    id: "rumours",
    kind: "clock",
    label: "Rumours spread",
    segments: 8,
    value: 0,
    odds: "unlikely",
  },
  {
    id: "orrin",
    kind: "vow",
    label: "Rescue Orrin from the Iron Pits",
    rank: "dangerous",
    ticks: 40,
    completed: true,
  },
];

/** Kira's connections: her own, the party's and a bonded one. */
export const sampleConnections: ConnectionItem[] = [
  {
    id: "sera",
    label: "Sera Kade",
    description: "Dock salvager at the Drowned Archive",
    href: "#sera-kade",
    rank: "troublesome",
    ticks: 9,
    bonded: false,
    menuActions: [
      { key: "share", label: "Share with the Party" },
      { key: "remove", label: "Remove Connection", tone: "danger" },
    ],
  },
  {
    id: "vell",
    label: "Archivist Vell",
    description: "Shared with the party",
    href: "#archivist-vell",
    rank: "dangerous",
    ticks: 16,
    bonded: false,
    menuActions: [
      { key: "keep:kira", label: "Keep for Kira Only" },
      { key: "keep:orrin", label: "Keep for Orrin Only" },
      { key: "remove", label: "Remove Connection", tone: "danger" },
    ],
  },
  {
    id: "mother-ash",
    label: "Mother Ash",
    description: "Keeper of the Bleakhold relay",
    href: "#mother-ash",
    rank: "formidable",
    ticks: 28,
    bonded: true,
    menuActions: [
      {
        key: "share",
        label: "Share with the Party",
        disabled: true,
        description: "Others in the party have their own connection",
      },
      { key: "remove", label: "Remove Connection", tone: "danger" },
    ],
  },
];

/** An Ironsworn character's bonds with world entries. */
export const sampleBonds: BondItem[] = [
  { id: "thornhold", label: "Thornhold", href: "#thornhold" },
  { id: "rhiannon", label: "Elder Rhiannon", href: "#elder-rhiannon" },
  { id: "iron-order", label: "The Iron Order", href: "#iron-order" },
];

/** Ironsworn tracks: no scene challenges. */
export const classicTracks: TrackItem[] = [
  {
    id: "wyvern",
    kind: "journey",
    label: "Track the wyvern to its roost in the Veiled Mountains",
    rank: "dangerous",
    ticks: 12,
  },
  {
    id: "hollow-crown",
    kind: "vow",
    label: "Recover the Hollow Crown",
    rank: "formidable",
    ticks: 14,
    description: "Sworn at the gates of Thornhold, before the elders.",
  },
  {
    id: "raiders",
    kind: "clock",
    label: "Raiders reach the village",
    segments: 8,
    value: 5,
    odds: "likely",
  },
];
