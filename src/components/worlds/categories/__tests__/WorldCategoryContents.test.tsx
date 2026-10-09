import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWorldStore } from "stores/world.store";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldCategoryContents } from "../WorldCategoryContents";
import { category, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  useWorldStore.setState({ worldPermission: WorldPermission.Viewer });
});

const entry = (id: string, categoryId: string, name: string) =>
  ({ id, categoryId, name }) as IWorldEntry;

describe("WorldCategoryContents", () => {
  it("lists this category's permitted entries and filters them by name", () => {
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    const view = render(
      <WorldCategoryContents category={category} search="" />,
    );
    expect(listen).toHaveBeenCalledWith(
      "reader",
      category.worldId,
      WorldPermission.Viewer,
      expect.any(Function),
      expect.any(Function),
    );
    expect(screen.getByLabelText("Loading entries")).toBeInTheDocument();

    const receive = listen.mock.calls[0][3];
    act(() =>
      receive(
        {
          one: entry("one", category.id, "Frosthaven"),
          two: entry("two", category.id, "Highmount"),
          other: entry("other", "other", "Other category"),
        },
        [],
        true,
      ),
    );
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.getByText("Highmount")).toBeInTheDocument();
    expect(screen.queryByText("Other category")).not.toBeInTheDocument();

    view.rerender(<WorldCategoryContents category={category} search="frost" />);
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.queryByText("Highmount")).not.toBeInTheDocument();

    act(() => receive({}, ["one", "two"], false));
    expect(
      screen.getByText("No entries in this category yet."),
    ).toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
