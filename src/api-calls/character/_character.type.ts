import { Nullable } from "api-calls/helpers.type";
import { ColorScheme } from "atoms/theme.atom";

export type StatsMap = Record<string, number>;

export enum InitiativeStatus {
  HasInitiative = "initiative",
  DoesNotHaveInitiative = "noInitiative",
  OutOfCombat = "outOfCombat",
}

export interface SpecialTrack {
  value: number;
  // Starforged only
  spentExperience?: { [index: number]: boolean };
  isLegacy?: boolean;
}

export interface CharacterDocument {
  uid: string;

  campaignId: string;

  // If the character is in a campaign, this ID will be ignored
  worldId?: Nullable<string>;

  name: string;
  stats: StatsMap;
  conditionMeters?: Record<string, number>; // Health, Sprit, Supply, etc.

  initiativeStatus?: InitiativeStatus;
  momentum: number;

  specialTracks?: Record<string, SpecialTrack>; // Bonds, Quests, Discoveries, etc.
  // Ironsworn only - starforged XP is stored on specialTracks
  experience?: {
    earned?: number;
    spent?: number;
  };

  debilities?: {
    [key: string]: boolean;
  };
  adds?: number;

  profileImage?: Nullable<{
    filename: string;
    position: {
      x: number;
      y: number;
    };
    scale: number;
  }>;

  customTracks?: {
    [trackName: string]: number;
  };

  // TODO - when migrating, don't forget these new propertys
  unspentExperience?: number;
  colorScheme?: ColorScheme;
}
