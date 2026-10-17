import { describe, expect, it } from "vitest";

import {
  countWorldEntryChildren,
  getWorldEntryAncestors,
  getWorldEntryPath,
  isTopLevelWorldEntry,
  isValidWorldEntryParent,
} from "../worldEntryParents";

const entry = (
  id: string,
  parentEntryId: string | null,
  categoryId = "places",
) => ({
  id,
  categoryId,
  parentEntryId,
});
// region > area > site, plus a loose place and a person.
const entries = Object.fromEntries(
  [
    entry("region", null),
    entry("area", "region"),
    entry("site", "area"),
    entry("loose", null),
    entry("person", null, "people"),
  ].map((item) => [item.id, item]),
);

describe("world entry parents", () => {
  it.each([
    ["site", "region", "a higher ancestor"],
    ["site", "loose", "an unrelated entry"],
    ["region", "loose", "an entry outside its descendants"],
    ["area", "region", "its current parent"],
  ])("lets %s move inside %s (%s)", (entryId, parentId) => {
    expect(isValidWorldEntryParent(entries, entryId, parentId)).toBe(true);
  });

  it("always allows moving to the top level", () => {
    expect(isValidWorldEntryParent(entries, "site", null)).toBe(true);
  });

  it.each([
    ["region", "region", "itself"],
    ["region", "area", "its child"],
    ["region", "site", "a deeper descendant"],
    ["loose", "person", "another category"],
    ["loose", "missing", "an entry that is not loaded"],
    ["missing", "loose", "an unknown entry"],
  ])("rejects moving %s inside %s (%s)", (entryId, parentId) => {
    expect(isValidWorldEntryParent(entries, entryId, parentId)).toBe(false);
  });

  it("terminates on existing loops that do not include the entry", () => {
    const looped = {
      ...entries,
      a: entry("a", "b"),
      b: entry("b", "a"),
    };
    expect(isValidWorldEntryParent(looped, "loose", "a")).toBe(true);
    expect(isValidWorldEntryParent(looped, "a", "loose")).toBe(true);
  });

  it("stops at an ancestor that is not loaded", () => {
    const broken = { ...entries, orphan: entry("orphan", "hidden") };
    expect(isValidWorldEntryParent(broken, "loose", "orphan")).toBe(true);
  });
});

describe("world entry hierarchy", () => {
  const named = Object.fromEntries(
    Object.values(entries).map((item) => [
      item.id,
      { ...item, name: item.id.toUpperCase() },
    ]),
  );

  it("lists visible ancestors outermost first", () => {
    expect(getWorldEntryAncestors(entries, "site").map((a) => a.id)).toEqual([
      "region",
      "area",
    ]);
    expect(getWorldEntryAncestors(entries, "region")).toEqual([]);
    expect(getWorldEntryPath(named, "site")).toBe("REGION / AREA");
  });

  it("stops at a hidden parent and at a loop", () => {
    const withoutRegion = Object.fromEntries(
      Object.entries(entries).filter(([id]) => id !== "region"),
    );
    expect(
      getWorldEntryAncestors(withoutRegion, "site").map((a) => a.id),
    ).toEqual(["area"]);
    const looped = {
      a: entry("a", "b"),
      b: entry("b", "a"),
    };
    expect(getWorldEntryAncestors(looped, "a").map((x) => x.id)).toEqual(["b"]);
  });

  it("puts entries with no visible parent at the top level", () => {
    expect(isTopLevelWorldEntry(entries, entries.region)).toBe(true);
    expect(isTopLevelWorldEntry(entries, entries.area)).toBe(false);
    const withoutRegion = Object.fromEntries(
      Object.entries(entries).filter(([id]) => id !== "region"),
    );
    expect(isTopLevelWorldEntry(withoutRegion, entries.area)).toBe(true);
  });

  it("counts visible children", () => {
    expect(countWorldEntryChildren(entries)).toEqual({ region: 1, area: 1 });
  });
});
