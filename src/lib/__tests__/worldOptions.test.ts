import { Datasworn } from "@datasworn-community/core";
import { describe, expect, it } from "vitest";

import { getOrderedPackageConfigs } from "data/package.config";

import {
  WorldOption,
  enumerateWorldOptions,
  worldOptions,
} from "../worldOptions";

// enumerateWorldOptions only visits packages known to package.config.ts (it
// walks getOrderedPackageConfigs to get a deterministic order), so these
// fakes are keyed by a real registered package id ("classic") with
// hand-built contents standing in for the loaded package.
describe("enumerateWorldOptions", () => {
  it("produces one world option per entry when worlds are present", () => {
    const packages: Record<string, Datasworn.RulesPackage> = {
      classic: {
        worlds: {
          alpha: { _id: "world:classic/alpha", name: "Alpha World" },
          beta: { _id: "world:classic/beta", name: "Beta World" },
        },
      } as unknown as Datasworn.RulesPackage,
    };

    expect(enumerateWorldOptions(packages, {})).toEqual<WorldOption[]>([
      {
        kind: "world",
        packageId: "classic",
        worldId: "world:classic/alpha",
        name: "Alpha World",
      },
      {
        kind: "world",
        packageId: "classic",
        worldId: "world:classic/beta",
        name: "Beta World",
      },
    ]);
  });

  it("produces a single package option when there are truths but no worlds", () => {
    const packages: Record<string, Datasworn.RulesPackage> = {
      classic: {
        truths: {
          truth_one: { _id: "truth:classic/truth_one" },
        },
      } as unknown as Datasworn.RulesPackage,
    };

    expect(
      enumerateWorldOptions(packages, { classic: "Package Display Name" }),
    ).toEqual<WorldOption[]>([
      { kind: "package", packageId: "classic", name: "Package Display Name" },
    ]);
  });

  it("falls back to the package id when there is no display name", () => {
    const packages: Record<string, Datasworn.RulesPackage> = {
      classic: {
        truths: {
          truth_one: { _id: "truth:classic/truth_one" },
        },
      } as unknown as Datasworn.RulesPackage,
    };

    expect(enumerateWorldOptions(packages, {})).toEqual<WorldOption[]>([
      { kind: "package", packageId: "classic", name: "classic" },
    ]);
  });

  it("skips packages with neither worlds nor truths", () => {
    const packages: Record<string, Datasworn.RulesPackage> = {
      classic: {} as unknown as Datasworn.RulesPackage,
    };

    expect(enumerateWorldOptions(packages, {})).toEqual<WorldOption[]>([]);
  });
});

describe("worldOptions", () => {
  it("matches enumerateWorldOptions over the real registered packages", async () => {
    const orderedConfigs = getOrderedPackageConfigs();

    const packages: Record<string, Datasworn.RulesPackage> = {};
    const displayNames: Record<string, string> = {};

    for (const config of orderedConfigs) {
      packages[config.id] = (await config.load()) as Datasworn.RulesPackage;
      displayNames[config.id] = config.name;
    }

    expect(enumerateWorldOptions(packages, displayNames)).toEqual(worldOptions);
  }, 30000);
});
