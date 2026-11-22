// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  categoryIconName,
  getCategoryIconPaths,
  loadCategoryIcons,
} from "../categoryIcons";
import { getGameIconKey } from "../gameIconKeys";
import { LEGACY_GAME_ICON_PATHS } from "../legacyGameIconPaths";

// Every Game Icons key react-icons 5.7.0 offered, which is every key a
// world category or entry can have stored.
const REACT_ICONS_KEYS: string[] = JSON.parse(
  readFileSync(
    new URL("./reactIcons5.7.0GiKeys.json", import.meta.url),
    "utf8",
  ),
);

describe("the Game Icons set", () => {
  it("renders every key stored from react-icons", async () => {
    const icons = await loadCategoryIcons();
    expect(REACT_ICONS_KEYS).toHaveLength(4040);
    const missing = REACT_ICONS_KEYS.filter(
      (key) => !getCategoryIconPaths(icons, key)?.length,
    );
    expect(missing).toEqual([]);
  });

  it("offers every Iconify icon once, under its own key", async () => {
    const icons = await loadCategoryIcons();
    expect(Object.keys(icons)).toHaveLength(4134);
    expect(icons.GiClockTower?.length).toBeGreaterThan(0);
  });

  it("keeps keys that differ only by case apart", async () => {
    expect(getGameIconKey("jetpack")).toBe("GiJetpack");
    expect(getGameIconKey("jet-pack")).toBe("GiJetPack");
    expect(getGameIconKey("headshot")).toBe("GiHeadshot");
    expect(getGameIconKey("head-shot")).toBe("GiHeadShot");
    const icons = await loadCategoryIcons();
    expect(icons.GiJetpack).not.toEqual(icons.GiJetPack);
    expect(icons.GiHeadshot).not.toEqual(icons.GiHeadShot);
  });

  it("names keys whose digits break the rule", () => {
    expect(getGameIconKey("ak47u")).toBe("GiAk47U");
    expect(getGameIconKey("h2o")).toBe("GiH2O");
    expect(getGameIconKey("mp5k")).toBe("GiMp5K");
    expect(getGameIconKey("ak47")).toBe("GiAk47");
    expect(getGameIconKey("3d-glasses")).toBe("Gi3dGlasses");
  });

  it("reads renamed icons' stored keys as the new icon", async () => {
    const icons = await loadCategoryIcons();
    expect(getCategoryIconPaths(icons, "GiEskimo")).toBe(
      icons.GiPersonInBlizzard,
    );
    expect(getCategoryIconPaths(icons, "GiSattelite")).toBe(icons.GiSatellite);
    expect(getCategoryIconPaths(icons, "GiStarSattelites")).toBe(
      icons.GiStarSatellites,
    );
    expect(icons.GiEskimo).toBeUndefined();
    expect(categoryIconName("GiSattelite")).toBe("Satellite");
  });

  it("keeps the old drawing of icons Iconify redrew", async () => {
    const icons = await loadCategoryIcons();
    expect(Object.keys(LEGACY_GAME_ICON_PATHS)).toHaveLength(38);
    expect(icons.GiBat).toBe(LEGACY_GAME_ICON_PATHS.GiBat);
  });
});
