import type { Datasworn } from "@datasworn-community/core";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldOraclesStore } from "stores/worldOracles.store";

import { computeEffectivePlayset } from "lib/effectivePlayset";
import { buildWorldOracleCatalog } from "lib/worldOracleCatalog";

import { TestWrapper } from "tests/TestWrapper";

import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { WorldReferenceSidebar } from "../WorldReferenceSidebar";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Oracle rows measure their secondary action.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

function oracle(key: string, name: string): Datasworn.OracleRollable {
  return {
    _id: `oracle_rollable:base/names/${key}`,
    _source: { title: "Base" },
    name,
    type: "oracle_rollable",
    oracle_type: "table_text",
    dice: "1d1",
    rows: [{ roll: { min: 1, max: 1 }, text: `${name} result` }],
  } as unknown as Datasworn.OracleRollable;
}

const base = {
  _id: "base",
  title: "Base",
  type: "ruleset",
  oracles: {
    names: {
      _id: "oracle_collection:base/names",
      name: "Names",
      type: "oracle_collection",
      oracle_type: "tables",
      collections: {},
      contents: {
        given: oracle("given", "Given Name"),
        family: oracle("family", "Family Name"),
      },
    },
  },
} as unknown as Datasworn.RulesPackage;

const binding = {
  packageId: "base",
  oracleId: "oracle_rollable:base/names/family",
  resolvedOracleId: "oracle_rollable:base/names/family",
};

beforeEach(() => {
  useWorldOraclesStore.setState({
    worldId: "world",
    loading: false,
    catalog: buildWorldOracleCatalog(
      { base },
      computeEffectivePlayset([], ["base"]),
    ),
  });
  useWorldCategoriesStore.setState({
    worldId: "world",
    fieldDefinitions: {
      surname: {
        id: "surname",
        categoryId: "npcs",
        worldId: "world",
        key: "surname",
        label: "Surname",
        type: WorldFieldType.Text,
        binding,
        gmOnly: false,
        sortOrder: 0,
        configuration: {
          version: 1,
          suggestions: [],
          helpText: "",
          visible: true,
          rules: [],
        },
      },
    },
  });
});

afterEach(() => {
  useWorldOraclesStore.getState().reset();
  useWorldCategoriesStore.getState().reset();
  useAppState.getState().clearAllRolls();
});

function renderSidebar(categoryId?: string) {
  return render(
    <MemoryRouter initialEntries={["/worlds/world"]}>
      <WorldReferenceSidebar worldId="world" categoryId={categoryId} />
    </MemoryRouter>,
    { wrapper: TestWrapper },
  );
}

describe("WorldReferenceSidebar", () => {
  it("lists the open category's bound oracles first", async () => {
    await act(async () => {
      renderSidebar("npcs");
    });
    const bound = screen.getByRole("list", { name: "Bound to this category" });
    expect(
      within(bound).getByRole("button", { name: /^(roll )?family name/i }),
    ).toHaveTextContent("Surname");
    expect(
      within(bound).queryByRole("button", { name: /^Given Name/ }),
    ).not.toBeInTheDocument();
  });

  it("has no bound list outside a category", async () => {
    await act(async () => {
      renderSidebar();
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "Reference" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Bound to this category" }),
    ).not.toBeInTheDocument();
  });

  it("rolls outside a game into a roll card, with no game log", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderSidebar("npcs");
    });
    const bound = screen.getByRole("list", { name: "Bound to this category" });
    await user.click(
      within(bound).getByRole("button", { name: /^(roll )?family name/i }),
    );
    expect(useAppState.getState().visibleRolls).toEqual([
      expect.objectContaining({
        id: undefined,
        roll: expect.objectContaining({ result: "Family Name result" }),
      }),
    ]);
  });
});
