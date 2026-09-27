import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("WorldCategoryContents", () => {
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
