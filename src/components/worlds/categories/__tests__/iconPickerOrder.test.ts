// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  MATERIAL_CATEGORY_ICON_KEYS,
  loadCategoryIcons,
} from "../categoryIcons";
import {
  ICON_SHORTLIST,
  getIconPickerSections,
  getIconShortlistGroupOrder,
  getIconShortlistSynonymKeys,
  getWorldIconKeys,
} from "../iconPickerOrder";

async function getAllKeys() {
  return [
    ...MATERIAL_CATEGORY_ICON_KEYS,
    ...Object.keys(await loadCategoryIcons()),
  ];
}

const locations = { name: "Locations", supportsMap: true, supportsBonds: true };
const npcs = { name: "NPCs", supportsMap: false, supportsBonds: true };

describe("the icon shortlist", () => {
  it("lists only icons the picker offers, each once", async () => {
    const offered = new Set(await getAllKeys());
    const listed = Object.values(ICON_SHORTLIST).flat();
    expect(listed.filter((key) => !offered.has(key))).toEqual([]);
    expect(new Set(listed).size).toBe(listed.length);
    const synonyms = getIconShortlistSynonymKeys();
    expect(synonyms.filter((key) => !offered.has(key))).toEqual([]);
    expect(synonyms.filter((key) => !listed.includes(key))).toEqual([]);
  });
});

describe("getIconShortlistGroupOrder", () => {
  it("leads with the group that fits the category, then the setting's own", () => {
    expect(
      getIconShortlistGroupOrder(locations, "world:starforged/forge"),
    ).toEqual(["places", "space", "people", "factions", "lore", "sea"]);
    expect(
      getIconShortlistGroupOrder(
        locations,
        "world:sundered_isles/sundered_isles",
      ).slice(0, 2),
    ).toEqual(["places", "sea"]);
    expect(getIconShortlistGroupOrder(npcs, null)[0]).toBe("people");
    expect(
      getIconShortlistGroupOrder(
        { name: "Factions", supportsMap: false, supportsBonds: false },
        null,
      )[0],
    ).toBe("factions");
    expect(
      getIconShortlistGroupOrder(
        { name: "Lore", supportsMap: false, supportsBonds: false },
        null,
      )[0],
    ).toBe("lore");
  });

  it("keeps the usual order for a category it can't place", () => {
    expect(
      getIconShortlistGroupOrder(
        { name: "Starships", supportsMap: false, supportsBonds: false },
        null,
      ),
    ).toEqual(["places", "people", "factions", "lore", "sea", "space"]);
  });
});

describe("getIconPickerSections", () => {
  it("lists every icon once: current, shortlist, in the world, then the rest", async () => {
    const allKeys = await getAllKeys();
    const sections = getIconPickerSections({
      allKeys,
      initialKey: "GiCompass",
      groupOrder: getIconShortlistGroupOrder(npcs, null),
      worldKeys: ["GiAbacus", "GiCompass"],
      query: "",
    });
    expect(sections.map(({ id }) => id)).toEqual([
      "current",
      "people",
      "places",
      "factions",
      "lore",
      "sea",
      "space",
      "world",
      "all",
    ]);
    expect(sections[0].keys).toEqual(["GiCompass"]);
    // Already shown as current, so the world section keeps only the other.
    expect(sections.find(({ id }) => id === "world")?.keys).toEqual([
      "GiAbacus",
    ]);
    const listed = sections.flatMap(({ keys }) => keys);
    expect(listed).toHaveLength(allKeys.length);
    expect(new Set(listed)).toEqual(new Set(allKeys));
  });

  it("keeps a renamed icon's stored key and lists it once", async () => {
    const sections = getIconPickerSections({
      allKeys: await getAllKeys(),
      initialKey: "GiEskimo",
      groupOrder: [],
      worldKeys: [],
      query: "",
    });
    const listed = sections.flatMap(({ keys }) => keys);
    expect(listed[0]).toBe("GiEskimo");
    expect(listed).not.toContain("GiPersonInBlizzard");
  });

  it("ranks whole words and prefixes before other matches in each section", async () => {
    const sections = getIconPickerSections({
      allKeys: await getAllKeys(),
      initialKey: null,
      groupOrder: getIconShortlistGroupOrder(locations, null),
      worldKeys: [],
      query: "ship",
    });
    const all = sections.find(({ id }) => id === "all")?.keys ?? [];
    expect(all.indexOf("GiShipBow")).toBeLessThan(
      all.indexOf("GiRelationshipBounds"),
    );
    // Synonyms find shortlist icons whose names don't say it.
    expect(sections.find(({ id }) => id === "sea")?.keys).toContain(
      "GiGalleon",
    );
  });

  it("finds settlements by the word people type", async () => {
    const sections = getIconPickerSections({
      allKeys: await getAllKeys(),
      initialKey: null,
      groupOrder: getIconShortlistGroupOrder(locations, null),
      worldKeys: [],
      query: "town",
    });
    expect(sections[0]).toEqual({
      id: "places",
      keys: expect.arrayContaining(["GiVillage", "GiModernCity"]),
    });
  });
});

describe("getWorldIconKeys", () => {
  it("orders the world's icons by use, once each", () => {
    expect(
      getWorldIconKeys([
        "GiCompass",
        null,
        "GiAbacus",
        "GiCompass",
        "GiEskimo",
      ]),
    ).toEqual(["GiCompass", "GiAbacus", "GiPersonInBlizzard"]);
  });
});
