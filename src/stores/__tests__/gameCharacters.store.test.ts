import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { CharacterService, ICharacter } from "services/character.service";

import { useGameCharactersStore } from "../gameCharacters.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const impacts = () =>
  useGameCharactersStore.getState().characters.c1.debilities;

beforeEach(() => {
  useGameCharactersStore.setState({
    characters: {
      c1: { debilities: { wounded: false } } as unknown as ICharacter,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  useGameCharactersStore.setState({ characters: {} });
});

it("marks an impact before the save and keeps it once saved", async () => {
  const save = vi
    .spyOn(CharacterService, "updateImpacts")
    .mockResolvedValue(undefined);
  const done = useGameCharactersStore
    .getState()
    .updateCharacterImpactValue("c1", "shaken", true);
  expect(impacts()).toEqual({ wounded: false, shaken: true });
  await done;
  expect(save).toHaveBeenCalledWith("c1", { wounded: false, shaken: true });
  expect(impacts()).toEqual({ wounded: false, shaken: true });
});

it("puts a failed impact back and rejects", async () => {
  vi.spyOn(CharacterService, "updateImpacts").mockRejectedValue(
    new Error("offline"),
  );
  const store = useGameCharactersStore.getState();
  await expect(
    store.updateCharacterImpactValue("c1", "wounded", true),
  ).rejects.toThrow("offline");
  expect(impacts()).toEqual({ wounded: false });
  await expect(
    store.updateCharacterImpactValue("c1", "shaken", true),
  ).rejects.toThrow("offline");
  expect(impacts()).toEqual({ wounded: false });
});

it("leaves an impact alone if it changed again before the save failed", async () => {
  let fail: (error: Error) => void = () => {};
  vi.spyOn(CharacterService, "updateImpacts")
    .mockImplementationOnce(
      () => new Promise((_resolve, reject) => (fail = reject)),
    )
    .mockResolvedValue(undefined);
  const store = useGameCharactersStore.getState();
  const first = store.updateCharacterImpactValue("c1", "wounded", true);
  await store.updateCharacterImpactValue("c1", "wounded", false);
  fail(new Error("offline"));
  await expect(first).rejects.toThrow("offline");
  expect(impacts()).toEqual({ wounded: false });
});
