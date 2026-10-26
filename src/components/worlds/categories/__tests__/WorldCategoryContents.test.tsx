import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type WorldNavigation,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import {
  useListenToWorldEntries,
  useWorldEntriesStore,
} from "stores/worldEntries.store";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import { WorldPermission } from "repositories/shared.types";

import type { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";
import {
  IWorldEntryFieldValue,
  WorldEntryFieldValuesService,
} from "services/worldEntryFieldValues.service";
import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryContents } from "../WorldCategoryContents";
import { category, field, optionList, translate } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "reader" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(
    WorldEntryFieldValuesService,
    "listenToWorldFieldValues",
  ).mockReturnValue(() => {});
  useWorldStore.setState({ worldPermission: WorldPermission.Viewer });
  useWorldCategoriesStore.setState({ fieldDefinitions: {} });
  useWorldEntriesStore.getState().reset();
});

const entry = (
  id: string,
  categoryId: string,
  name: string,
  parentEntryId: string | null = null,
) => ({ id, categoryId, name, parentEntryId }) as IWorldEntry;

const navigation: WorldNavigation = {
  view: { type: "category", categoryId: category.id },
  getLinkProps: (view) => ({ href: getWorldViewPath(category.worldId, view) }),
  navigate: () => {},
};

// The world page or game owns the entries subscription; the harness stands in
// for it.
function ListeningContents({ search }: { search: string }) {
  useListenToWorldEntries(category.worldId);
  return (
    <WorldCategoryContents
      category={category}
      search={search}
      navigation={navigation}
    />
  );
}

function renderList(search = "", listedCategory: IWorldCategory = category) {
  return render(
    <MemoryRouter>
      <WorldCategoryContents
        category={listedCategory}
        search={search}
        navigation={navigation}
      />
    </MemoryRouter>,
  );
}

function loadWorld(
  entries: IWorldEntry[],
  values: Omit<IWorldEntryFieldValue, "worldId" | "gmOnly">[],
  definitions: IWorldFieldDefinition[],
) {
  useWorldCategoriesStore.setState({
    fieldDefinitions: Object.fromEntries(
      definitions.map((definition) => [definition.id, definition]),
    ),
  });
  useWorldEntriesStore.setState((store) => {
    store.entryState.loading = false;
    store.entryState.entries = Object.fromEntries(
      entries.map((item) => [item.id, item]),
    );
    store.fieldValueState.valuesByEntry = {};
    values.forEach((value) => {
      store.fieldValueState.valuesByEntry[value.entryId] ??= {};
      store.fieldValueState.valuesByEntry[value.entryId][
        value.fieldDefinitionId
      ] = { ...value, worldId: category.worldId, gmOnly: false };
    });
  });
}

// A row's accessible name is the entry name followed by its subtitle.
const row = (name: string) =>
  screen.getByRole("link", { name: new RegExp(`^${name}`) });

describe("WorldCategoryContents", () => {
  it("lists this category's permitted entries and filters them by name", () => {
    const unsubscribe = vi.fn();
    const listen = vi
      .spyOn(WorldEntriesService, "listenToWorldEntries")
      .mockReturnValue(unsubscribe);
    const view = render(
      <MemoryRouter>
        <ListeningContents search="" />
      </MemoryRouter>,
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

    view.rerender(
      <MemoryRouter>
        <ListeningContents search="frost" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Frosthaven")).toBeInTheDocument();
    expect(screen.queryByText("Highmount")).not.toBeInTheDocument();

    act(() => receive({}, ["one", "two"], false));
    expect(
      screen.getByText("No entries in this category yet."),
    ).toBeInTheDocument();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("links each row to its entry", () => {
    loadWorld([entry("one", category.id, "Frosthaven")], [], []);
    renderList();
    expect(row("Frosthaven")).toHaveAttribute(
      "href",
      getWorldViewPath(category.worldId, {
        type: "entry",
        categoryId: category.id,
        entryId: "one",
      }),
    );
  });

  it("shows the subtitle field under each name and searches it", () => {
    const region = optionList(
      { id: "region", label: "Region" },
      { multiple: true },
    );
    loadWorld(
      [
        entry("one", category.id, "Frosthaven"),
        entry("two", category.id, "Highmount"),
      ],
      [
        { entryId: "one", fieldDefinitionId: "region", value: ["Hinterlands"] },
        {
          entryId: "two",
          fieldDefinitionId: "region",
          value: ["Havens", "Ragged Coast"],
        },
      ],
      [region],
    );
    const view = renderList("", {
      ...category,
      subtitleFieldDefinitionId: "region",
    });
    expect(
      within(row("Frosthaven")).getByText("Hinterlands"),
    ).toBeInTheDocument();
    expect(
      within(row("Highmount")).getByText("Havens, Ragged Coast"),
    ).toBeInTheDocument();

    view.unmount();
    renderList("  ragged ", {
      ...category,
      subtitleFieldDefinitionId: "region",
    });
    expect(screen.getByText("Highmount")).toBeInTheDocument();
    expect(screen.queryByText("Frosthaven")).not.toBeInTheDocument();
  });

  it("hides a subtitle its field's rules hide for that entry", () => {
    const kind = optionList({ id: "kind", label: "Kind" });
    const ruler = field({
      id: "ruler",
      label: "Ruler",
      configuration: createWorldFieldConfiguration({
        rules: [
          {
            conditions: [
              {
                source: "entry",
                fieldId: "kind",
                operator: "equals",
                value: "Ruin",
              },
            ],
            visible: false,
          },
        ],
      }),
    });
    loadWorld(
      [
        entry("one", category.id, "Frosthaven"),
        entry("two", category.id, "Old Keep"),
      ],
      [
        { entryId: "one", fieldDefinitionId: "ruler", value: "Elder Kell" },
        { entryId: "two", fieldDefinitionId: "kind", value: "Ruin" },
        { entryId: "two", fieldDefinitionId: "ruler", value: "Nobody" },
      ],
      [kind, ruler],
    );
    renderList("", { ...category, subtitleFieldDefinitionId: "ruler" });
    expect(screen.getByText("Elder Kell")).toBeInTheDocument();
    expect(screen.queryByText("Nobody")).not.toBeInTheDocument();
  });

  describe("with nesting", () => {
    // The Ironlands > The Hinterlands > Kingsmark > Kingsmark Keep, and the
    // Havens beside it.
    const places = [
      entry("ironlands", category.id, "The Ironlands"),
      entry("hinterlands", category.id, "The Hinterlands", "ironlands"),
      entry("kingsmark", category.id, "Kingsmark", "hinterlands"),
      entry("keep", category.id, "Kingsmark Keep", "kingsmark"),
      entry("havens", category.id, "The Havens"),
    ];

    it("lists only the top level, with places holding others as folders", () => {
      loadWorld(places, [], []);
      renderList();
      expect(
        screen.getAllByRole("link").map((link) => link.textContent),
      ).toEqual(["The Ironlands1 place", "The Havens"]);
      expect(row("The Ironlands")).toHaveAttribute(
        "href",
        `/worlds/${category.worldId}/categories/${category.id}/entries/ironlands/places`,
      );
      expect(row("The Havens")).toHaveAttribute(
        "href",
        `/worlds/${category.worldId}/categories/${category.id}/entries/havens`,
      );
    });

    it("lists entries under a hidden parent at the top level", () => {
      loadWorld(places.slice(1), [], []);
      renderList();
      expect(row("The Hinterlands")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /^Kingsmark/ })).toBeNull();
    });

    it("filters every level and shows each match's path", () => {
      loadWorld(places, [], []);
      renderList("king");
      expect(screen.getByRole("status")).toHaveTextContent(
        "2 matches across every level",
      );
      expect(
        screen.getAllByRole("link").map((link) => link.textContent),
      ).toEqual([
        "KingsmarkThe Ironlands / The Hinterlands",
        "Kingsmark KeepThe Ironlands / The Hinterlands / Kingsmark",
      ]);
    });

    it("lists everything flat in a category without nesting", () => {
      loadWorld(places, [], []);
      renderList("", { ...category, supportsHierarchy: false });
      expect(screen.getAllByRole("link")).toHaveLength(5);
    });
  });
});
