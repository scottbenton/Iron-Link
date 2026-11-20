import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";

import { WorldGameRulesNotice } from "../WorldGameRulesNotice";

const goalId = "oracle_rollable:starforged/character/goal";
const replacementId = "oracle_rollable:starsmith/character/goal";
const context = vi.hoisted(() => ({
  gameId: "game-a" as string | undefined,
  catalog: null as null | {
    replacementMap: Record<string, string>;
    worldReplacementMap: Record<string, string>;
  },
  categories: {
    worldId: "world-a",
    storedFieldDefinitions: {} as Record<string, unknown>,
  },
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameIdOptional: () => context.gameId,
}));
vi.mock("hooks/useWorldOracles", () => ({
  useWorldOracles: () => ({ catalog: context.catalog }),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (
    select: (value: typeof context.categories) => unknown,
  ) => select(context.categories),
}));

const notice =
  "This world is shared with games that use other rules, so some of its fields roll different oracles in this game than in those games.";

beforeEach(() => {
  context.gameId = "game-a";
  context.catalog = {
    replacementMap: {},
    worldReplacementMap: { [goalId]: replacementId },
  };
  context.categories.storedFieldDefinitions = {
    goal: {
      binding: {
        packageId: "starforged",
        oracleId: goalId,
        resolvedOracleId: goalId,
      },
      configuration: { rules: [] },
    },
  };
});

describe("WorldGameRulesNotice", () => {
  it("says when this game's rules roll a field differently", () => {
    render(<WorldGameRulesNotice worldId="world-a" />);
    expect(screen.getByText(notice)).toBeInTheDocument();
  });

  it("stays quiet when every field rolls the same", () => {
    context.catalog = { replacementMap: {}, worldReplacementMap: {} };
    render(<WorldGameRulesNotice worldId="world-a" />);
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
  });

  it("stays quiet for fields pinned to an exact oracle", () => {
    context.categories.storedFieldDefinitions = {
      goal: {
        binding: {
          packageId: "starforged",
          oracleId: goalId,
          resolvedOracleId: goalId,
          exact: true,
        },
        configuration: { rules: [] },
      },
    };
    render(<WorldGameRulesNotice worldId="world-a" />);
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
  });

  it("stays quiet on the world page", () => {
    context.gameId = undefined;
    render(<WorldGameRulesNotice worldId="world-a" />);
    expect(screen.queryByText(notice)).not.toBeInTheDocument();
  });
});
