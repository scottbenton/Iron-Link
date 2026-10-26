import { describe, expect, it } from "vitest";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import {
  getDefaultWorldEntryPermissions,
  getLinkedWorldEntryPermissions,
  getWorldEntryVisibility,
} from "../worldEntryPermissions";

const guidesOnly = {
  readPermissions: ReadPermissions.OnlyGuides,
  editPermissions: EditPermissions.OnlyGuides,
};
const everyone = {
  readPermissions: ReadPermissions.AllPlayers,
  editPermissions: EditPermissions.AllPlayers,
};

describe("getWorldEntryVisibility", () => {
  it.each([
    [ReadPermissions.OnlyGuides, "guides"],
    [ReadPermissions.AllPlayers, "everyone"],
    [ReadPermissions.GuidesAndAuthor, "everyone"],
    [ReadPermissions.OnlyAuthor, "everyone"],
  ])("reads %s as %s", (read, visibility) => {
    expect(getWorldEntryVisibility(read)).toBe(visibility);
  });
});

describe("getDefaultWorldEntryPermissions", () => {
  it("starts a Guide's entries in a guided world as prep", () => {
    expect(getDefaultWorldEntryPermissions(true, true)).toEqual(guidesOnly);
  });

  it.each([
    [false, true],
    [true, false],
    [false, false],
  ])(
    "shares everything else with everyone (guide %s, guided %s)",
    (isGuide, guided) => {
      expect(getDefaultWorldEntryPermissions(isGuide, guided)).toEqual(
        everyone,
      );
    },
  );
});

describe("getLinkedWorldEntryPermissions", () => {
  const guide = { gmOnly: false, isGuide: true, guided: true };

  it("keeps a Guide's link from prep or a Guide only field as prep", () => {
    expect(getLinkedWorldEntryPermissions(guidesOnly, guide)).toEqual(
      guidesOnly,
    );
    expect(
      getLinkedWorldEntryPermissions(everyone, { ...guide, gmOnly: true }),
    ).toEqual(guidesOnly);
  });

  it("shares a link from a shared entry", () => {
    expect(getLinkedWorldEntryPermissions(everyone, guide)).toEqual(everyone);
  });

  it("shares whatever a player or an unguided world creates", () => {
    expect(
      getLinkedWorldEntryPermissions(guidesOnly, {
        ...guide,
        isGuide: false,
        gmOnly: true,
      }),
    ).toEqual(everyone);
    expect(
      getLinkedWorldEntryPermissions(guidesOnly, { ...guide, guided: false }),
    ).toEqual(everyone);
  });
});
