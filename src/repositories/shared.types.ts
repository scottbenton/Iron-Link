export interface SpecialTrack {
  value: number;
  isLegacy?: boolean;
}

export enum ColorScheme {
  Default = "default",
  Cinder = "cinder",
  Eidolon = "eidolon",
  Hinterlands = "hinterlands",
  Myriad = "myriad",
  Mystic = "mystic",
  PrideTraditional = "pride_traditional",
}
export enum RollResult {
  StrongHit = "strong_hit",
  WeakHit = "weak_hit",
  Miss = "miss",
}
export enum RollType {
  Stat = "stat",
  OracleTable = "oracle_table",
  TrackProgress = "track_progress",
  SpecialTrackProgress = "special_track_progress",
  ClockProgression = "clock_progression",
}
export enum ReadPermissions {
  OnlyAuthor = "only_author",
  OnlyGuides = "only_guides",
  AllPlayers = "all_players",
  GuidesAndAuthor = "guides_and_author",
  Public = "public",
}
export enum EditPermissions {
  OnlyAuthor = "only_author",
  OnlyGuides = "only_guides",
  GuidesAndAuthor = "guides_and_author",
  AllPlayers = "all_players",
}
// Mirrors the values returned by the world_role() database function:
// owner/editor/viewer come from explicit world_players rows, guide/player
// are derived live from game_players rows on linked games.
export enum WorldPermission {
  Owner = "owner",
  Editor = "editor",
  Guide = "guide",
  Player = "player",
  Viewer = "viewer",
  None = "none",
}
