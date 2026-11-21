import { describeMark } from "../ProgressTrack/progress";
import type { OracleOdds, TrackKind } from "./tracksPanelTypes";

export interface TracksPanelStrings {
  /** The eyebrow and Add Track menu label of each kind. */
  kindLabels: Record<TrackKind, string>;
  oddsLabels: Record<OracleOdds, string>;
  showCompleted: string;
  addTrack: string;
  addTrackMenu: string;

  noTracks: string;
  noTracksMessage: string;
  noActiveTracks: string;
  /** How many completed tracks Show Completed would bring back. */
  noActiveTracksMessage: (completed: number) => string;

  /** The track menu's button: "Options for Recover the Hollow Crown". */
  optionsLabel: (label: string) => string;
  edit: (isClock: boolean) => string;
  /** The card's own Complete button, beside its roll. */
  completeShort: string;
  /** Its accessible name: "Complete Recover the Hollow Crown". */
  completeLabel: (label: string) => string;
  reopen: (isClock: boolean) => string;
  remove: (isClock: boolean) => string;
  openOnSecondScreen: string;
  closeOnSecondScreen: string;
  deleteTitle: (label: string) => string;
  deleteDescription: (label: string) => string;
  completedAnnouncement: (label: string) => string;
  reopenedAnnouncement: (label: string) => string;
  deletedAnnouncement: (label: string) => string;

  /** A completion roll's name: "Fulfill Your Vow for Recover the Hollow Crown". */
  rollMoveLabel: (move: string, label: string) => string;
  rollProgress: string;
  rollProgressLabel: (label: string) => string;
  odds: string;
  oddsLabel: (label: string) => string;
  tension: string;
  tensionLabel: (label: string) => string;

  connections: string;
  showBonded: string;
  addConnection: string;
  /** The Add button's visible text, short beside Show Bonded. */
  addConnectionShort: string;
  noConnections: string;
  noConnectionsMessage: string;
  allBonded: string;
  /** How many bonded connections Show Bonded would bring back. */
  allBondedMessage: (bonded: number) => string;
  connectionType: string;
  bonded: string;
  rank: string;
  connectionOptionsLabel: (label: string) => string;
  /** The roll menu's button when the rules have several connection moves. */
  rollConnection: string;
  rollConnectionLabel: (label: string) => string;

  bonds: string;
  noBonds: string;
  noBondsMessage: string;
  clearBondLabel: (label: string) => string;

  /** TrackDialog's title and main button when adding: "Add Vow". */
  dialogAddTitle: (kindLabel: string) => string;
  dialogEditTitle: (kindLabel: string) => string;
  dialogSave: string;
  dialogCancel: string;
  dialogTitleField: string;
  dialogTitleRequired: string;
  dialogDescriptionField: string;
  dialogRankField: string;
  /** Under each rank: "2 boxes per mark". */
  dialogRankDescription: (ticks: number) => string;
  dialogResetProgress: string;
  dialogResetProgressHint: string;
  dialogSegmentsField: string;
}

export const defaultTracksPanelStrings: TracksPanelStrings = {
  kindLabels: {
    vow: "Vow",
    journey: "Journey",
    combat: "Combat",
    sceneChallenge: "Scene Challenge",
    clock: "Clock",
  },
  oddsLabels: {
    almostCertain: "Almost Certain",
    likely: "Likely",
    fiftyFifty: "50/50",
    unlikely: "Unlikely",
    smallChance: "Small Chance",
  },
  showCompleted: "Show Completed",
  addTrack: "Add Track",
  addTrackMenu: "Kinds of Track",

  noTracks: "No tracks yet",
  noTracksMessage:
    "Swear a vow, set out on a journey or start a clock with Add Track.",
  noActiveTracks: "No active tracks",
  noActiveTracksMessage: (completed) =>
    completed === 1
      ? "One completed track is hidden."
      : `${completed} completed tracks are hidden.`,

  optionsLabel: (label) => `Options for ${label}`,
  edit: (isClock) => (isClock ? "Edit Clock" : "Edit Track"),
  completeShort: "Complete",
  completeLabel: (label) => `Complete ${label}`,
  reopen: (isClock) => (isClock ? "Reopen Clock" : "Reopen Track"),
  remove: (isClock) => (isClock ? "Delete Clock" : "Delete Track"),
  openOnSecondScreen: "Open on Second Screen",
  closeOnSecondScreen: "Close on Second Screen",
  deleteTitle: (label) => `Delete ${label}?`,
  deleteDescription: (label) =>
    `${label} and its progress are gone for everyone in the game. This cannot be undone.`,
  completedAnnouncement: (label) => `Completed ${label}`,
  reopenedAnnouncement: (label) => `Reopened ${label}`,
  deletedAnnouncement: (label) => `Deleted ${label}`,

  rollMoveLabel: (move, label) => `${move} for ${label}`,
  rollProgress: "Roll Progress",
  rollProgressLabel: (label) => `Roll Progress for ${label}`,
  odds: "Odds",
  oddsLabel: (label) => `Odds for ${label}`,
  tension: "Tension",
  tensionLabel: (label) => `Tension for ${label}`,

  connections: "Connections",
  showBonded: "Show Bonded",
  addConnection: "Add Connection",
  addConnectionShort: "Add",
  noConnections: "No connections yet",
  noConnectionsMessage: "Add the people you make a connection with.",
  allBonded: "Every connection is bonded",
  allBondedMessage: (bonded) =>
    bonded === 1
      ? "One bonded connection is hidden."
      : `${bonded} bonded connections are hidden.`,
  connectionType: "Connection",
  bonded: "Bonded",
  rank: "Rank",
  connectionOptionsLabel: (label) => `Options for ${label}`,
  rollConnection: "Roll Progress",
  rollConnectionLabel: (label) => `Roll Progress for ${label}`,

  bonds: "Bonds",
  noBonds: "No bonds yet",
  noBondsMessage: "Form bonds from a world entry's page in Notes.",
  clearBondLabel: (label) => `Clear Bond with ${label}`,

  dialogAddTitle: (kind) => `Add ${kind}`,
  dialogEditTitle: (kind) => `Edit ${kind}`,
  dialogSave: "Save Changes",
  dialogCancel: "Cancel",
  dialogTitleField: "Title",
  dialogTitleRequired: "Give it a title.",
  dialogDescriptionField: "Description",
  dialogRankField: "Rank",
  dialogRankDescription: describeMark,
  dialogResetProgress: "Reset Progress",
  dialogResetProgressHint: "Start the track again at the new rank.",
  dialogSegmentsField: "Segments",
};
