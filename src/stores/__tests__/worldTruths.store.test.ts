import { afterEach, beforeEach, expect, it, vi } from "vitest";

import {
  WorldTruthChoice,
  WorldTruthsService,
} from "services/worldTruths.service";

import { useWorldTruthsStore } from "../worldTruths.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const store = () => useWorldTruthsStore.getState();

const option = (truthId: string, optionId: string): WorldTruthChoice => ({
  truthId,
  optionId,
  subOptionId: null,
  customDescription: null,
});

type OnTruths = (
  changed: WorldTruthChoice[],
  removed: string[],
  replace: boolean,
) => void;
type OnQuests = (
  changed: Record<string, string>,
  removed: string[],
  replace: boolean,
) => void;

let onTruths: OnTruths;
let onQuests: OnQuests;
let stopped: number;

beforeEach(() => {
  stopped = 0;
  vi.spyOn(WorldTruthsService, "listenToWorldTruths").mockImplementation(
    (_id, callback) => {
      onTruths = callback;
      return () => stopped++;
    },
  );
  vi.spyOn(
    WorldTruthsService,
    "listenToWorldTruthQuestStarters",
  ).mockImplementation((_id, callback) => {
    onQuests = callback;
    return () => stopped++;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  useWorldTruthsStore.setState({
    truths: {},
    questStarters: {},
    loading: {},
    errors: {},
  });
});

it("shares one listener per world and applies changes", () => {
  const stopA = store().listenToWorldTruths("w");
  const stopB = store().listenToWorldTruths("w");
  expect(WorldTruthsService.listenToWorldTruths).toHaveBeenCalledTimes(1);
  expect(store().loading.w).toBe(true);

  onTruths([option("t1", "o1"), option("t2", "o2")], [], true);
  onQuests({ t3: "Quest" }, [], true);
  onTruths([option("t1", "o9")], ["t2"], false);
  expect(store().truths.w).toEqual({ t1: option("t1", "o9") });
  expect(store().questStarters.w).toEqual({ t3: "Quest" });
  expect(store().loading.w).toBe(false);

  stopA();
  expect(stopped).toBe(0);
  stopB();
  expect(stopped).toBe(2);
  expect(store().truths.w).toBeUndefined();
});

it("shows a written truth at once and restores the old choice on failure", async () => {
  store().listenToWorldTruths("w");
  onTruths([option("t1", "o1")], [], true);
  let fail: (error: Error) => void = () => {};
  vi.spyOn(WorldTruthsService, "setCustomTruth").mockReturnValue(
    new Promise((_resolve, reject) => {
      fail = reject;
    }),
  );

  const saving = store().setCustomTruth("w", "t1", "Ours", "Go");
  expect(store().truths.w.t1.customDescription).toBe("Ours");
  expect(store().questStarters.w.t1).toBe("Go");

  fail(new Error("no"));
  await expect(saving).rejects.toThrow("no");
  expect(store().truths.w.t1).toEqual(option("t1", "o1"));
  expect(store().questStarters.w.t1).toBeUndefined();
});

it("choosing an option drops the written quest starter locally", async () => {
  store().listenToWorldTruths("w");
  onQuests({ t1: "Go" }, [], true);
  vi.spyOn(WorldTruthsService, "chooseOption").mockResolvedValue();
  await store().chooseOption("w", "t1", "o1", "row");
  expect(store().truths.w.t1).toEqual({
    ...option("t1", "o1"),
    subOptionId: "row",
  });
  expect(store().questStarters.w.t1).toBeUndefined();

  vi.spyOn(WorldTruthsService, "clearTruth").mockResolvedValue();
  await store().clearTruth("w", "t1");
  expect(store().truths.w.t1).toBeUndefined();
});
