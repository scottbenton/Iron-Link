import type { TFunction } from "i18next";

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

export function getDefaultTracksPanelStrings(t: TFunction): TracksPanelStrings {
  return {
    kindLabels: {
      vow: t("ui.tracks-panel.kind-vow", "Vow"),
      journey: t("ui.tracks-panel.kind-journey", "Journey"),
      combat: t("ui.tracks-panel.kind-combat", "Combat"),
      sceneChallenge: t(
        "ui.tracks-panel.kind-scene-challenge",
        "Scene Challenge",
      ),
      clock: t("ui.tracks-panel.kind-clock", "Clock"),
    },
    oddsLabels: {
      almostCertain: t("ui.tracks-panel.odds-almost-certain", "Almost Certain"),
      likely: t("ui.tracks-panel.odds-likely", "Likely"),
      fiftyFifty: t("ui.tracks-panel.odds-fifty-fifty", "50/50"),
      unlikely: t("ui.tracks-panel.odds-unlikely", "Unlikely"),
      smallChance: t("ui.tracks-panel.odds-small-chance", "Small Chance"),
    },
    showCompleted: t("ui.tracks-panel.show-completed", "Show Completed"),
    addTrack: t("ui.tracks-panel.add-track", "Add Track"),
    addTrackMenu: t("ui.tracks-panel.add-track-menu", "Kinds of Track"),

    noTracks: t("ui.tracks-panel.no-tracks", "No tracks yet"),
    noTracksMessage: t(
      "ui.tracks-panel.no-tracks-message",
      "Swear a vow, set out on a journey or start a clock with Add Track.",
    ),
    noActiveTracks: t("ui.tracks-panel.no-active-tracks", "No active tracks"),
    noActiveTracksMessage: (completed) =>
      t(
        "ui.tracks-panel.no-active-tracks-message",
        "{{count}} completed tracks are hidden.",
        {
          count: completed,
          defaultValue_one: "One completed track is hidden.",
        },
      ),

    optionsLabel: (label) =>
      t("ui.tracks-panel.options", "Options for {{label}}", { label }),
    edit: (isClock) =>
      isClock
        ? t("ui.tracks-panel.edit-clock", "Edit Clock")
        : t("ui.tracks-panel.edit-track", "Edit Track"),
    completeShort: t("ui.tracks-panel.complete-short", "Complete"),
    completeLabel: (label) =>
      t("ui.tracks-panel.complete-label", "Complete {{label}}", { label }),
    reopen: (isClock) =>
      isClock
        ? t("ui.tracks-panel.reopen-clock", "Reopen Clock")
        : t("ui.tracks-panel.reopen-track", "Reopen Track"),
    remove: (isClock) =>
      isClock
        ? t("ui.tracks-panel.delete-clock", "Delete Clock")
        : t("ui.tracks-panel.delete-track", "Delete Track"),
    openOnSecondScreen: t(
      "ui.tracks-panel.open-on-second-screen",
      "Open on Second Screen",
    ),
    closeOnSecondScreen: t(
      "ui.tracks-panel.close-on-second-screen",
      "Close on Second Screen",
    ),
    deleteTitle: (label) =>
      t("ui.tracks-panel.delete-title", "Delete {{label}}?", { label }),
    deleteDescription: (label) =>
      t(
        "ui.tracks-panel.delete-description",
        "{{label}} and its progress are gone for everyone in the game. This cannot be undone.",
        { label },
      ),
    completedAnnouncement: (label) =>
      t("ui.tracks-panel.completed-announcement", "Completed {{label}}", {
        label,
      }),
    reopenedAnnouncement: (label) =>
      t("ui.tracks-panel.reopened-announcement", "Reopened {{label}}", {
        label,
      }),
    deletedAnnouncement: (label) =>
      t("ui.tracks-panel.deleted-announcement", "Deleted {{label}}", { label }),

    rollMoveLabel: (move, label) =>
      t("ui.tracks-panel.roll-move", "{{move}} for {{label}}", { move, label }),
    rollProgress: t("ui.tracks-panel.roll-progress", "Roll Progress"),
    rollProgressLabel: (label) =>
      t("ui.tracks-panel.roll-progress-label", "Roll Progress for {{label}}", {
        label,
      }),
    odds: t("ui.tracks-panel.odds", "Odds"),
    oddsLabel: (label) =>
      t("ui.tracks-panel.odds-label", "Odds for {{label}}", { label }),
    tension: t("ui.tracks-panel.tension", "Tension"),
    tensionLabel: (label) =>
      t("ui.tracks-panel.tension-label", "Tension for {{label}}", { label }),

    connections: t("ui.tracks-panel.connections", "Connections"),
    showBonded: t("ui.tracks-panel.show-bonded", "Show Bonded"),
    addConnection: t("ui.tracks-panel.add-connection", "Add Connection"),
    addConnectionShort: t("ui.tracks-panel.add-connection-short", "Add"),
    noConnections: t("ui.tracks-panel.no-connections", "No connections yet"),
    noConnectionsMessage: t(
      "ui.tracks-panel.no-connections-message",
      "Add the people you make a connection with.",
    ),
    allBonded: t("ui.tracks-panel.all-bonded", "Every connection is bonded"),
    allBondedMessage: (bonded) =>
      t(
        "ui.tracks-panel.all-bonded-message",
        "{{count}} bonded connections are hidden.",
        {
          count: bonded,
          defaultValue_one: "One bonded connection is hidden.",
        },
      ),
    connectionType: t("ui.tracks-panel.connection-type", "Connection"),
    bonded: t("ui.tracks-panel.bonded", "Bonded"),
    rank: t("ui.tracks-panel.rank", "Rank"),
    connectionOptionsLabel: (label) =>
      t("ui.tracks-panel.options", "Options for {{label}}", { label }),
    rollConnection: t("ui.tracks-panel.roll-connection", "Roll Progress"),
    rollConnectionLabel: (label) =>
      t("ui.tracks-panel.roll-progress-label", "Roll Progress for {{label}}", {
        label,
      }),

    bonds: t("ui.tracks-panel.bonds", "Bonds"),
    noBonds: t("ui.tracks-panel.no-bonds", "No bonds yet"),
    noBondsMessage: t(
      "ui.tracks-panel.no-bonds-message",
      "Form bonds from a world entry's page in Notes.",
    ),
    clearBondLabel: (label) =>
      t("ui.tracks-panel.clear-bond", "Clear Bond with {{label}}", { label }),

    dialogAddTitle: (kind) =>
      t("ui.tracks-panel.dialog-add-title", "Add {{kind}}", { kind }),
    dialogEditTitle: (kind) =>
      t("ui.tracks-panel.dialog-edit-title", "Edit {{kind}}", { kind }),
    dialogSave: t("ui.tracks-panel.dialog-save", "Save Changes"),
    dialogCancel: t("ui.common.cancel", "Cancel"),
    dialogTitleField: t("ui.tracks-panel.dialog-title-field", "Title"),
    dialogTitleRequired: t(
      "ui.tracks-panel.dialog-title-required",
      "Give it a title.",
    ),
    dialogDescriptionField: t(
      "ui.tracks-panel.dialog-description-field",
      "Description",
    ),
    dialogRankField: t("ui.tracks-panel.dialog-rank-field", "Rank"),
    dialogRankDescription: (ticks) => describeMark(t, ticks),
    dialogResetProgress: t(
      "ui.tracks-panel.dialog-reset-progress",
      "Reset Progress",
    ),
    dialogResetProgressHint: t(
      "ui.tracks-panel.dialog-reset-progress-hint",
      "Start the track again at the new rank.",
    ),
    dialogSegmentsField: t("ui.tracks-panel.dialog-segments-field", "Segments"),
  };
}
