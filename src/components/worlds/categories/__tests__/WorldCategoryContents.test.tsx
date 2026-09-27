import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldCategoryContents } from "../WorldCategoryContents";
import { category, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
const auth = vi.hoisted(() => ({ uid: "reader" }));
vi.mock("stores/auth.store", () => ({ useUID: () => auth.uid }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  auth.uid = "reader";
});

describe("WorldCategoryContents", () => {
  it("drops old-user entries and ignores stale callbacks when authentication changes", () => {
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    const view = render(
      <WorldCategoryContents
        category={category}
        permission={WorldPermission.Owner}
      />,
    );
    const previous = listen.mock.calls[0][3];
    act(() =>
      previous(
        {
          one: {
            id: "one",
            categoryId: category.id,
            name: "Private location",
          } as IWorldEntry,
        },
        [],
        true,
      ),
    );
    expect(screen.getByText("Private location")).toBeInTheDocument();
    auth.uid = "another-reader";
    view.rerender(
      <WorldCategoryContents
        category={category}
        permission={WorldPermission.Viewer}
      />,
    );
    expect(screen.queryByText("Private location")).not.toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(listen).toHaveBeenLastCalledWith(
      "another-reader",
      category.worldId,
      WorldPermission.Viewer,
      expect.any(Function),
      expect.any(Function),
    );
    act(() =>
      previous(
        {
          one: {
            id: "one",
            categoryId: category.id,
            name: "Stale private location",
          } as IWorldEntry,
        },
        [],
        true,
      ),
    );
    expect(
      screen.queryByText("Stale private location"),
    ).not.toBeInTheDocument();
    act(() => listen.mock.calls[1][3]({}, [], true));
    expect(
      screen.getByText("No entries in this category yet."),
    ).toBeInTheDocument();
  });
  it("uses the permission-aware entry subscription for readers and filters by category", () => {
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    const view = render(
      <WorldCategoryContents
        category={category}
        permission={WorldPermission.Viewer}
      />,
    );
    expect(listen).toHaveBeenCalledWith(
      "reader",
      category.worldId,
      WorldPermission.Viewer,
      expect.any(Function),
      expect.any(Function),
    );
    const receive = listen.mock.calls[0][3];
    act(() =>
      receive(
        {
          one: {
            id: "one",
            categoryId: category.id,
            name: "Frosthaven",
          } as IWorldEntry,
          other: {
            id: "other",
            categoryId: "other",
            name: "Other category",
          } as IWorldEntry,
        },
        [],
        true,
      ),
    );
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.queryByText("Other category")).not.toBeInTheDocument();
    act(() => receive({}, ["one"], false));
    expect(
      screen.getByText("No entries in this category yet."),
    ).toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
