// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ReadPermissions, WorldPermission } from "repositories/shared.types";

import { getWorldSecretsConfig } from "../worldNotesSecrets";

const base = {
  worldId: "world",
  surface: { worldEntryId: "entry" },
  permission: WorldPermission.Guide,
  isGuided: true,
  readPermissions: ReadPermissions.AllPlayers,
};

describe("getWorldSecretsConfig", () => {
  it.each([
    WorldPermission.Owner,
    WorldPermission.Editor,
    WorldPermission.Guide,
  ])("offers secrets to a world %s in a guided world", (permission) => {
    expect(getWorldSecretsConfig({ ...base, permission })).toEqual({
      surface: { worldEntryId: "entry" },
      roomKeySource: { guideWorldId: "world" },
      sharedOnlyWith: null,
      canInsert: true,
    });
  });

  it.each([
    WorldPermission.Player,
    WorldPermission.Viewer,
    WorldPermission.None,
    null,
  ])("gives a %s no secrets at all", (permission) => {
    expect(getWorldSecretsConfig({ ...base, permission })).toBeNull();
  });

  it("shows an unguided world's existing secrets but offers no new ones", () => {
    expect(getWorldSecretsConfig({ ...base, isGuided: false })?.canInsert).toBe(
      false,
    );
  });

  it("offers them in an entry only Guides read so far, and says so", () => {
    expect(
      getWorldSecretsConfig({
        ...base,
        readPermissions: ReadPermissions.OnlyGuides,
      }),
    ).toMatchObject({ canInsert: true, sharedOnlyWith: "guides" });
  });
});
