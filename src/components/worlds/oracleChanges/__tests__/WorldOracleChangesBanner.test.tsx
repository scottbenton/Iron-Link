import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { translate } from "components/worlds/categories/__tests__/fixtures";
import {
  type WorldView,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { useWorldOracleChangesStore } from "stores/worldOracleChanges.store";

import type { IWorldOracleChange } from "services/worldOracleChanges.service";

import { WorldOracleChangesBanner } from "../WorldOracleChangesBanner";

const announce = vi.hoisted(() => vi.fn());
const dismissChanges = vi.hoisted(() => vi.fn());
const fields = vi.hoisted(() => ({
  fieldDefinitions: {
    name: { id: "name", categoryId: "npcs" },
    role: { id: "role", categoryId: "npcs" },
    region: { id: "region", categoryId: "places" },
  } as Record<string, { id: string; categoryId: string }>,
}));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("react-i18next", async (original) => ({
  ...(await original<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameIdOptional: () => "game-a",
}));
vi.mock("stores/appState.store", () => ({
  useSetAnnouncement: () => announce,
}));
vi.mock("providers/SnackbarProvider", () => ({
  useSnackbar: () => ({ error: vi.fn() }),
}));
vi.mock("stores/worldCategories.store", () => ({
  useWorldCategoriesStore: (select: (value: typeof fields) => unknown) =>
    select(fields),
}));
vi.mock("services/worldOracleChanges.service", () => ({
  WorldOracleChangesService: { dismissChanges },
}));

function change(
  id: string,
  overrides: Partial<IWorldOracleChange> = {},
): IWorldOracleChange {
  return {
    id,
    worldId: "world-a",
    fieldId: "name",
    ruleIndex: null,
    previousOracleId: "starforged/oracles/a",
    nextOracleId: "starsmith/oracles/a",
    sourceGameId: "game-b",
    seq: 1,
    updatedAt: new Date(),
    ...overrides,
  };
}

const navigation = {
  view: { type: "world" } as WorldView,
  getLinkProps: (view: WorldView) => ({
    href: getWorldViewPath("world-a", view),
  }),
  navigate: vi.fn(),
};

function setChanges(changes: IWorldOracleChange[], dismissedSeq = 0) {
  useWorldOracleChangesStore.setState({
    worldId: "world-a",
    changes: Object.fromEntries(changes.map((item) => [item.id, item])),
    loading: false,
    gameId: "game-a",
    dismissedSeq,
    dismissalLoading: false,
  });
}

function renderBanner() {
  return render(
    <MemoryRouter>
      <WorldOracleChangesBanner navigation={navigation} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useWorldOracleChangesStore.getState().reset();
  announce.mockReset();
  dismissChanges.mockReset();
});

describe("WorldOracleChangesBanner", () => {
  it("counts fields another game moved and reviews their category", () => {
    setChanges([
      change("1", { seq: 1 }),
      change("2", { fieldId: "name", ruleIndex: 0, seq: 2 }),
      change("3", { fieldId: "role", seq: 3 }),
      // This game chose its own changes when it saved them.
      change("4", { fieldId: "region", sourceGameId: "game-a", seq: 4 }),
    ]);
    renderBanner();
    expect(
      screen.getByText("2 world fields now roll different oracles"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      getWorldViewPath("world-a", {
        type: "category-settings",
        categoryId: "npcs",
      }),
    );
  });

  it("reviews World settings when the fields span categories", () => {
    setChanges([change("1"), change("2", { fieldId: "region", seq: 2 })]);
    renderBanner();
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      getWorldViewPath("world-a", { type: "settings" }),
    );
  });

  it("stays hidden for changes this game already dismissed", () => {
    setChanges([change("1", { seq: 3 })], 3);
    renderBanner();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses through the newest change and announces it", async () => {
    const user = userEvent.setup();
    dismissChanges.mockResolvedValue(undefined);
    setChanges([change("1", { seq: 4 }), change("2", { seq: 9 })]);
    renderBanner();
    expect(
      screen.getByText("1 world field now rolls a different oracle"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismissChanges).toHaveBeenCalledWith("game-a", 9);
    expect(announce).toHaveBeenCalledWith("Oracle changes dismissed");
    expect(
      screen.queryByText("1 world field now rolls a different oracle"),
    ).not.toBeInTheDocument();
  });
});
