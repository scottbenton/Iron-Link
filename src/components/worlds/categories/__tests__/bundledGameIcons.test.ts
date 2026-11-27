// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BUNDLED_GAME_ICONS } from "../bundledGameIcons";
import { loadCategoryIcons } from "../categoryIcons";

// Same sources as scripts/generate-bundled-game-icons.mjs.
function readDefaultIconKeys() {
  const keys = new Set<string>();
  JSON.parse(
    readFileSync("supabase/world-defaults.json", "utf8"),
    (_, value: unknown) => {
      if (typeof value === "string" && /^Gi[A-Z0-9]\w*$/.test(value)) {
        keys.add(value);
      }
      return value;
    },
  );
  for (const file of [
    "src/lib/worldMap/locationTypeIcons.ts",
    "src/components/worlds/categories/WorldFieldKindPreview.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    for (const [, key] of source.matchAll(/"(Gi[A-Z0-9]\w*)"/g)) keys.add(key);
  }
  return [...keys].sort();
}

describe("bundled Game Icons", () => {
  it("are exactly the icons the defaults use (else run npm run generate:bundled-game-icons)", () => {
    expect(Object.keys(BUNDLED_GAME_ICONS).sort()).toEqual(
      readDefaultIconKeys(),
    );
  });

  it("draw the same as the full set", async () => {
    const icons = await loadCategoryIcons();
    for (const [key, paths] of Object.entries(BUNDLED_GAME_ICONS)) {
      expect(paths, key).toEqual(icons[key]);
    }
  });
});
