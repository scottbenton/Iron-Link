// Stored game icon keys are react-icons component names ("GiClockTower"),
// kept from when the set came from react-icons/gi. The icons now come from
// Iconify's Game Icons, named in kebab case ("clock-tower"), and each one's
// key is built from its name, so stored keys need no migration.

// Iconify names whose react-icons key does not follow the naming rule.
const KEY_EXCEPTIONS: Record<string, string> = {
  ak47u: "GiAk47U",
  h2o: "GiH2O",
  mp5k: "GiMp5K",
};

// react-icons keys for icons Iconify renamed. They stay readable so stored
// icons keep rendering; the picker offers the new names.
export const RENAMED_GAME_ICON_KEYS: Record<string, string> = {
  GiEskimo: "GiPersonInBlizzard",
  GiSattelite: "GiSatellite",
  GiStarSattelites: "GiStarSatellites",
};

// "clock-tower" -> "GiClockTower", "3d-glasses" -> "Gi3dGlasses". Case
// pairs stay apart: "jetpack" -> "GiJetpack", "jet-pack" -> "GiJetPack".
export function getGameIconKey(iconifyName: string) {
  return (
    KEY_EXCEPTIONS[iconifyName] ??
    "Gi" +
      iconifyName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
  );
}
