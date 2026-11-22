import { describe, expect, it } from "vitest";

import { getLocationTypeIcon } from "../locationTypeIcons";

const FORGE = "world:starforged/forge";
const ISLES = "world:sundered_isles/sundered_isles";
const IRONLANDS = "world:classic/ironlands";

describe("getLocationTypeIcon", () => {
  it("gives each setting its own settlement icon", () => {
    expect(getLocationTypeIcon("Settlement", IRONLANDS)?.key).toBe(
      "GiVikingLonghouse",
    );
    expect(getLocationTypeIcon("Settlement", FORGE)?.key).toBe(
      "GiDefenseSatellite",
    );
    expect(getLocationTypeIcon("Settlement", ISLES)?.key).toBe(
      "GiMedievalVillage01",
    );
  });

  it("uses the setting's icon for typed variants of a type", () => {
    expect(getLocationTypeIcon("Orbital settlement", FORGE)?.key).toBe(
      "GiDefenseSatellite",
    );
  });

  it("falls back to the shared icons without a setting or override", () => {
    expect(getLocationTypeIcon("Settlement")?.key).toBe("GiVikingLonghouse");
    expect(getLocationTypeIcon("settlement", null)?.key).toBe(
      "GiVikingLonghouse",
    );
    expect(getLocationTypeIcon("Planet", FORGE)?.key).toBe("GiWorld");
    expect(getLocationTypeIcon("Ruin", ISLES)?.key).toBe("GiBrokenWall");
    expect(getLocationTypeIcon("Swamp", FORGE)).toBeUndefined();
    expect(getLocationTypeIcon(undefined, FORGE)).toBeUndefined();
  });
});
