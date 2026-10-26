import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type WorldNavigation,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import { useWorldOraclesStore } from "stores/worldOracles.store";

import { catalogOf, oracle } from "lib/__tests__/worldOracleFixtures";
import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";
import {
  WorldEntryFieldValuesService,
  WorldFieldValue,
} from "services/worldEntryFieldValues.service";
import {
  IWorldFieldDefinition,
  WorldFieldDefinitionsService,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import {
  category,
  field,
  linkedEntry,
  optionList,
  translate,
} from "../../categories/__tests__/fixtures";
import {
  WorldEntryFields,
  isWorldEntryFieldFullRow,
} from "../WorldEntryFields";
import { worldEntry } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "author" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

const PEOPLE = "bbbbbbbb-0000-4000-8000-000000000000";

const navigation: WorldNavigation = {
  view: { type: "entry", categoryId: category.id, entryId: "entry-1" },
  getLinkProps: (view) => ({ href: getWorldViewPath(category.worldId, view) }),
  navigate: vi.fn(),
};

let setValue: ReturnType<typeof vi.fn>;
let deleteValue: ReturnType<typeof vi.fn>;

// Text and option fields save a moment after their last change, and typed
// text waits a moment of its own before that. These tests run on fake timers
// and pass that time with `passSaveDelay`.
function setupUserWithFakeTimers() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}
async function passSaveDelay() {
  for (let step = 0; step < 2; step++) {
    await act(() => vi.advanceTimersByTimeAsync(1000));
  }
}

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.restoreAllMocks();
  useWorldEntriesStore.getState().reset();
  useWorldCategoriesStore.setState({
    worldId: category.worldId,
    fieldDefinitions: {},
  });
  useWorldStore.setState({
    worldPermission: WorldPermission.Guide,
    isGuided: true,
  });
  setValue = vi.fn().mockResolvedValue(undefined);
  deleteValue = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(
    WorldEntryFieldValuesService,
    "setWorldEntryFieldValue",
  ).mockImplementation(setValue);
  vi.spyOn(
    WorldEntryFieldValuesService,
    "deleteWorldEntryFieldValue",
  ).mockImplementation(deleteValue);
});

function defineFields(...definitions: IWorldFieldDefinition[]) {
  useWorldCategoriesStore.setState({
    fieldDefinitions: Object.fromEntries(
      definitions.map((definition) => [definition.id, definition]),
    ),
  });
}

function loadEntries(...entries: IWorldEntry[]) {
  useWorldEntriesStore.setState((store) => {
    store.entryState.loading = false;
    store.entryState.entries = Object.fromEntries(
      entries.map((item) => [item.id, item]),
    );
  });
}

function storeValue(
  entryId: string,
  fieldDefinitionId: string,
  value: WorldFieldValue | null,
) {
  act(() => {
    useWorldEntriesStore.setState((store) => {
      store.fieldValueState.valuesByEntry[entryId] ??= {};
      store.fieldValueState.valuesByEntry[entryId][fieldDefinitionId] = {
        entryId,
        fieldDefinitionId,
        worldId: category.worldId,
        gmOnly: false,
        value,
      };
    });
  });
}

function renderFields({
  entry = worldEntry(),
  canEdit = true,
  guided = true,
} = {}) {
  return render(
    <MemoryRouter>
      <WorldEntryFields
        entry={entry}
        category={category}
        canEdit={canEdit}
        guided={guided}
        navigation={navigation}
      />
    </MemoryRouter>,
  );
}

const fieldLabels = () =>
  [
    ...screen
      .getByRole("region", { name: "Hollowmere fields" })
      .querySelectorAll("label"),
  ].map((label) => label.textContent);

describe("WorldEntryFields", () => {
  describe("text", () => {
    it("saves after a pause, and deletes the value when cleared", async () => {
      const user = setupUserWithFakeTimers();
      defineFields(
        field({
          id: "climate",
          label: "Climate",
          configuration: createWorldFieldConfiguration({
            helpText: "What the weather is like",
          }),
        }),
      );
      loadEntries(worldEntry());
      storeValue("entry-1", "climate", "Cold");
      renderFields();

      const input = screen.getByRole("textbox", { name: "Climate" });
      expect(input).toHaveValue("Cold");
      expect(input).toHaveAccessibleDescription("What the weather is like");
      expect(input).toHaveAttribute("maxLength", "1000");

      await user.type(input, " and wet ");
      await passSaveDelay();
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "climate",
        "Cold and wet",
      );
      setValue.mockClear();

      await user.clear(input);
      await user.tab();
      await passSaveDelay();
      expect(deleteValue).toHaveBeenCalledWith("entry-1", "climate");
      expect(setValue).not.toHaveBeenCalled();
    });

    it("keeps a remote change from replacing the text while it has focus", async () => {
      const user = userEvent.setup();
      defineFields(field({ id: "climate", label: "Climate" }));
      loadEntries(worldEntry());
      storeValue("entry-1", "climate", "Cold");
      renderFields();

      const input = screen.getByRole("textbox", { name: "Climate" });
      await user.click(input);
      storeValue("entry-1", "climate", "Warm");
      expect(input).toHaveValue("Cold");

      await user.tab();
      expect(input).toHaveValue("Warm");
      expect(setValue).not.toHaveBeenCalled();

      storeValue("entry-1", "climate", "Mild");
      expect(input).toHaveValue("Mild");
    });
  });

  describe("option lists", () => {
    it("offers suggestions and used values when opened, and accepts new values in an open list", async () => {
      const user = setupUserWithFakeTimers();
      const fetchOptions = vi
        .spyOn(WorldFieldDefinitionsService, "getWorldFieldOptions")
        .mockResolvedValue(["Settlement", "Ruin", "Lighthouse"]);
      defineFields(
        optionList(
          { id: "kind", label: "Kind" },
          { suggestions: ["Settlement", "Ruin"], allowOther: true },
        ),
      );
      loadEntries(worldEntry());
      renderFields();

      const input = screen.getByRole("combobox", { name: "Kind" });
      await user.click(input);
      await user.keyboard("{ArrowDown}");
      expect(fetchOptions).toHaveBeenCalledWith(category.worldId, "kind");
      expect(
        await screen.findByRole("option", { name: "Lighthouse" }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("option", { name: "Lighthouse" }));
      await passSaveDelay();
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "kind",
        "Lighthouse",
      );

      await user.clear(input);
      await user.type(input, "Shrine{Enter}");
      await passSaveDelay();
      expect(setValue).toHaveBeenLastCalledWith(
        "entry-1",
        category.worldId,
        "kind",
        "Shrine",
      );
    });

    it("only offers a strict list's options, but still shows a stored value outside them", async () => {
      const user = setupUserWithFakeTimers();
      const fetchOptions = vi.spyOn(
        WorldFieldDefinitionsService,
        "getWorldFieldOptions",
      );
      defineFields(
        optionList(
          { id: "kind", label: "Kind" },
          { suggestions: ["Settlement", "Ruin"], allowOther: false },
        ),
      );
      loadEntries(worldEntry());
      storeValue("entry-1", "kind", "Lighthouse");
      renderFields();

      const input = screen.getByRole("combobox", { name: "Kind" });
      expect(input).toHaveValue("Lighthouse");
      await user.click(input);
      expect(
        screen.getAllByRole("option").map((option) => option.textContent),
      ).toEqual(["Settlement", "Ruin", "Lighthouse"]);

      await user.clear(input);
      await user.type(input, "Shrine{Enter}");
      await passSaveDelay();
      expect(setValue).not.toHaveBeenCalled();

      await user.clear(input);
      await user.keyboard("{ArrowDown}");
      await user.click(screen.getByRole("option", { name: "Ruin" }));
      await passSaveDelay();
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "kind",
        "Ruin",
      );
      expect(fetchOptions).not.toHaveBeenCalled();
    });

    it("explains a value the database rejects", async () => {
      const user = setupUserWithFakeTimers();
      setValue.mockRejectedValue(
        new Error("Value must be one of the field options"),
      );
      defineFields(
        optionList(
          { id: "kind", label: "Kind" },
          { suggestions: ["Settlement"], allowOther: false },
        ),
      );
      loadEntries(worldEntry());
      renderFields();
      await user.click(screen.getByRole("combobox", { name: "Kind" }));
      await user.click(screen.getByRole("option", { name: "Settlement" }));
      await passSaveDelay();
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Value must be one of the field options",
      );
    });

    it("shows several values as chips and deletes the value when the last is removed", async () => {
      const user = setupUserWithFakeTimers();
      defineFields(
        optionList(
          { id: "tags", label: "Tags" },
          { suggestions: ["Coastal", "Haunted"], multiple: true },
        ),
      );
      vi.spyOn(
        WorldFieldDefinitionsService,
        "getWorldFieldOptions",
      ).mockResolvedValue(["Coastal", "Haunted"]);
      loadEntries(worldEntry());
      storeValue("entry-1", "tags", ["Coastal", "Haunted"]);
      renderFields();

      const coastal = screen.getByRole("button", { name: "Coastal" });
      await user.click(within(coastal).getByTestId("CancelIcon"));
      await passSaveDelay();
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "tags",
        ["Haunted"],
      );

      storeValue("entry-1", "tags", ["Haunted"]);
      const haunted = screen.getByRole("button", { name: "Haunted" });
      await user.click(within(haunted).getByTestId("CancelIcon"));
      await passSaveDelay();
      expect(deleteValue).toHaveBeenCalledWith("entry-1", "tags");
    });
  });

  describe("linked entries", () => {
    const kell = worldEntry({ id: "kell", categoryId: PEOPLE, name: "Kell" });
    const ash = worldEntry({ id: "ash", categoryId: PEOPLE, name: "Ash" });

    it("links chosen entries as chips and keeps links to entries it cannot see", async () => {
      const user = userEvent.setup();
      defineFields(
        linkedEntry(
          PEOPLE,
          { id: "residents", label: "Residents" },
          { multiple: true },
        ),
      );
      loadEntries(worldEntry(), kell, ash);
      storeValue("entry-1", "residents", ["kell", "unreadable"]);
      renderFields();

      expect(screen.getByRole("link", { name: "Kell" })).toHaveAttribute(
        "href",
        getWorldViewPath(category.worldId, {
          type: "entry",
          categoryId: PEOPLE,
          entryId: "kell",
        }),
      );
      await user.click(
        within(screen.getByRole("link", { name: "Kell" })).getByTestId(
          "CancelIcon",
        ),
      );
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "residents",
        ["unreadable"],
      );

      await user.click(screen.getByRole("combobox", { name: "Residents" }));
      expect(
        screen.getAllByRole("option").map((option) => option.textContent),
      ).toEqual(["Ash"]);
      await user.click(screen.getByRole("option", { name: "Ash" }));
      expect(setValue).toHaveBeenCalledWith(
        "entry-1",
        category.worldId,
        "residents",
        ["kell", "ash", "unreadable"],
      );
    });

    it("creates an entry shared like this one and links it", async () => {
      const user = userEvent.setup();
      const add = vi
        .spyOn(WorldEntriesService, "addWorldEntry")
        .mockResolvedValue("created");
      defineFields(linkedEntry(PEOPLE, { id: "home", label: "Location" }));
      const entry = worldEntry({
        readPermissions: ReadPermissions.AllPlayers,
        editPermissions: EditPermissions.AllPlayers,
      });
      loadEntries(entry, kell);
      storeValue("entry-1", "home", "kell");
      renderFields({ entry });

      await user.type(
        screen.getByRole("combobox", { name: "Location" }),
        "Brinehold",
      );
      await user.click(
        screen.getByRole("option", { name: 'Create "Brinehold"' }),
      );
      await waitFor(() =>
        expect(setValue).toHaveBeenCalledWith(
          "entry-1",
          category.worldId,
          "home",
          "created",
        ),
      );
      expect(add).toHaveBeenCalledWith(
        "author",
        category.worldId,
        PEOPLE,
        "Brinehold",
        ReadPermissions.AllPlayers,
        EditPermissions.AllPlayers,
        undefined,
      );
    });

    it("creates Guide-only entries from a Guide-only field, and shares what a player creates", async () => {
      const user = userEvent.setup();
      const add = vi
        .spyOn(WorldEntriesService, "addWorldEntry")
        .mockResolvedValue("created");
      defineFields(
        linkedEntry(
          PEOPLE,
          { id: "secret", label: "Secret contacts", gmOnly: true },
          { multiple: true },
        ),
        linkedEntry(PEOPLE, { id: "home", label: "Location", sortOrder: 1 }),
      );
      // A player cannot pick Guides-only, so their copy falls back.
      const entry = worldEntry({
        readPermissions: ReadPermissions.OnlyGuides,
        editPermissions: EditPermissions.OnlyGuides,
      });
      loadEntries(entry, kell);
      storeValue("entry-1", "secret", ["kell"]);
      const { unmount } = renderFields({ entry });

      await user.type(
        screen.getByRole("combobox", { name: "Secret contacts" }),
        "Veil",
      );
      await user.click(screen.getByRole("option", { name: 'Create "Veil"' }));
      await waitFor(() =>
        expect(setValue).toHaveBeenCalledWith(
          "entry-1",
          category.worldId,
          "secret",
          ["kell", "created"],
        ),
      );
      expect(add).toHaveBeenLastCalledWith(
        "author",
        category.worldId,
        PEOPLE,
        "Veil",
        ReadPermissions.OnlyGuides,
        EditPermissions.OnlyGuides,
        undefined,
      );
      unmount();

      useWorldStore.setState({ worldPermission: WorldPermission.Player });
      renderFields({ entry });
      expect(
        screen.queryByRole("combobox", { name: "Secret contacts" }),
      ).not.toBeInTheDocument();
      await user.type(
        screen.getByRole("combobox", { name: "Location" }),
        "Dock",
      );
      await user.click(screen.getByRole("option", { name: 'Create "Dock"' }));
      await waitFor(() =>
        expect(add).toHaveBeenLastCalledWith(
          "author",
          category.worldId,
          PEOPLE,
          "Dock",
          ReadPermissions.AllPlayers,
          EditPermissions.AllPlayers,
          undefined,
        ),
      );
    });

    it("shares an entry a Guide creates from an older private entry", async () => {
      const user = userEvent.setup();
      const add = vi
        .spyOn(WorldEntriesService, "addWorldEntry")
        .mockResolvedValue("created");
      defineFields(linkedEntry(PEOPLE, { id: "home", label: "Location" }));
      const entry = worldEntry({
        authorId: "player",
        readPermissions: ReadPermissions.GuidesAndAuthor,
        editPermissions: EditPermissions.GuidesAndAuthor,
      });
      loadEntries(entry);
      renderFields({ entry });

      await user.type(
        screen.getByRole("combobox", { name: "Location" }),
        "Brinehold",
      );
      await user.click(
        screen.getByRole("option", { name: 'Create "Brinehold"' }),
      );
      await waitFor(() =>
        expect(add).toHaveBeenCalledWith(
          "author",
          category.worldId,
          PEOPLE,
          "Brinehold",
          ReadPermissions.AllPlayers,
          EditPermissions.AllPlayers,
          undefined,
        ),
      );
    });

    it("says Empty only while nothing is linked", () => {
      defineFields(
        linkedEntry(
          PEOPLE,
          { id: "residents", label: "Residents" },
          { multiple: true },
        ),
        linkedEntry(PEOPLE, { id: "home", label: "Location", sortOrder: 1 }),
      );
      loadEntries(worldEntry(), kell);
      storeValue("entry-1", "residents", ["kell"]);
      renderFields();

      expect(
        screen.getByRole("combobox", { name: "Location" }),
      ).toHaveAttribute("placeholder", "Empty");
      expect(
        screen.getByRole("combobox", { name: "Residents" }),
      ).not.toHaveAttribute("placeholder");
    });

    it("does not offer to create entries to world viewers", async () => {
      const user = userEvent.setup();
      useWorldStore.setState({ worldPermission: WorldPermission.Viewer });
      defineFields(linkedEntry(PEOPLE, { id: "home", label: "Location" }));
      loadEntries(worldEntry(), kell);
      renderFields();
      await user.type(
        screen.getByRole("combobox", { name: "Location" }),
        "Dock",
      );
      expect(
        screen.queryByRole("option", { name: 'Create "Dock"' }),
      ).not.toBeInTheDocument();
    });
  });

  describe("conditional fields", () => {
    const kind = optionList(
      { id: "kind", label: "Kind" },
      { suggestions: ["Settlement", "Ruin"] },
    );
    const population = field({
      id: "population",
      label: "Population",
      sortOrder: 1,
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
    const climate = field({
      id: "climate",
      label: "Climate",
      sortOrder: 2,
      configuration: createWorldFieldConfiguration({
        rules: [
          {
            conditions: [
              {
                source: "ancestor",
                ancestor: { fieldId: "kind", value: "Region" },
                fieldId: "weather",
                operator: "equals",
                value: "Frozen",
              },
            ],
            label: "Ice depth",
            helpText: "How thick the ice is",
          },
        ],
      }),
    });

    it("hides and relabels fields as this entry's and its ancestors' values change, keeping hidden values", () => {
      defineFields(kind, population, climate);
      loadEntries(
        worldEntry({ parentEntryId: "region" }),
        worldEntry({ id: "region", name: "The North" }),
      );
      storeValue("entry-1", "population", "200");
      storeValue("region", "kind", "Region");
      renderFields({ entry: worldEntry({ parentEntryId: "region" }) });

      expect(screen.getByRole("textbox", { name: "Population" })).toHaveValue(
        "200",
      );
      expect(
        screen.getByRole("textbox", { name: "Climate" }),
      ).toBeInTheDocument();

      storeValue("entry-1", "kind", "Ruin");
      expect(
        screen.queryByRole("textbox", { name: "Population" }),
      ).not.toBeInTheDocument();

      storeValue("region", "weather", "Frozen");
      const iceDepth = screen.getByRole("textbox", { name: "Ice depth" });
      expect(iceDepth).toHaveAccessibleDescription("How thick the ice is");

      storeValue("entry-1", "kind", "Settlement");
      expect(screen.getByRole("textbox", { name: "Population" })).toHaveValue(
        "200",
      );
      expect(deleteValue).not.toHaveBeenCalled();
      expect(setValue).not.toHaveBeenCalled();
    });

    it("follows the entry's new parent after a move", () => {
      defineFields(kind, population, climate);
      loadEntries(
        worldEntry({ parentEntryId: "region" }),
        worldEntry({ id: "region", name: "The North" }),
        worldEntry({ id: "south", name: "The South" }),
      );
      storeValue("region", "kind", "Region");
      storeValue("south", "kind", "Region");
      storeValue("south", "weather", "Frozen");
      renderFields({ entry: worldEntry({ parentEntryId: "region" }) });
      expect(
        screen.getByRole("textbox", { name: "Climate" }),
      ).toBeInTheDocument();

      act(() =>
        useWorldEntriesStore.setState((store) => {
          store.entryState.entries["entry-1"].parentEntryId = "south";
        }),
      );
      expect(
        screen.getByRole("textbox", { name: "Ice depth" }),
      ).toBeInTheDocument();
    });
    it("tells editors which parent a field needs before it can roll", () => {
      const weather = field({ id: "weather", label: "Weather", sortOrder: 3 });
      const snowfall = field({
        id: "snowfall",
        label: "Snowfall",
        sortOrder: 4,
        configuration: createWorldFieldConfiguration({
          rules: [
            {
              conditions: [
                {
                  source: "ancestor",
                  ancestor: { fieldId: "kind", value: "Region" },
                  fieldId: "weather",
                  operator: "equals",
                  value: "Frozen",
                },
              ],
              binding: {
                packageId: "test",
                oracleId: "oracle_rollable:test/snowfall",
                resolvedOracleId: "oracle_rollable:test/snowfall",
              },
            },
          ],
        }),
      });
      defineFields(kind, weather, snowfall);
      loadEntries(
        worldEntry({ parentEntryId: "region" }),
        worldEntry({ id: "region", name: "The North" }),
      );
      storeValue("region", "kind", "Region");
      const hint =
        "To roll Snowfall, move this entry under a Region whose Weather is Frozen.";
      const { unmount } = renderFields({
        entry: worldEntry({ parentEntryId: "region" }),
      });
      expect(screen.getByText(hint)).toBeInTheDocument();

      storeValue("region", "weather", "Frozen");
      expect(screen.queryByText(hint)).not.toBeInTheDocument();

      storeValue("region", "weather", "Mild");
      unmount();
      renderFields({
        entry: worldEntry({ parentEntryId: "region" }),
        canEdit: false,
      });
      expect(screen.queryByText(hint)).not.toBeInTheDocument();
    });
  });

  describe("Guide-only fields", () => {
    const fields = () => [
      field({ id: "name", label: "Known as", sortOrder: 0 }),
      field({ id: "secret", label: "Secret", sortOrder: 1, gmOnly: true }),
      field({ id: "look", label: "Look", sortOrder: 2 }),
    ];

    it("gives them a Guide only well below Details in a guided world", () => {
      defineFields(...fields());
      loadEntries(worldEntry());
      renderFields();
      const details = screen.getByRole("region", { name: "Details" });
      const section = screen.getByRole("region", { name: "Guide only" });
      expect(
        within(details).getByRole("textbox", { name: "Known as" }),
      ).toBeInTheDocument();
      expect(
        within(section).getByRole("textbox", { name: "Secret" }),
      ).toBeInTheDocument();
      expect(fieldLabels()).toEqual(["Known as", "Look", "Secret"]);
    });

    it("collapses each well from its heading", async () => {
      const user = userEvent.setup();
      defineFields(...fields());
      loadEntries(worldEntry());
      renderFields();
      const toggle = screen.getByRole("button", { name: /^Guide only/ });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await waitFor(() =>
        expect(
          screen.queryByRole("textbox", { name: "Secret" }),
        ).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole("textbox", { name: "Known as" }),
      ).toBeInTheDocument();
    });

    it("keeps them in order in the Details well when the world is not guided", () => {
      defineFields(...fields());
      loadEntries(worldEntry());
      renderFields({ guided: false });
      expect(
        within(screen.getByRole("region", { name: "Details" })).getByRole(
          "textbox",
          { name: "Secret" },
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Guide only" }),
      ).not.toBeInTheDocument();
      expect(fieldLabels()).toEqual(["Known as", "Secret", "Look"]);
    });

    it("never shows them to anyone else", () => {
      useWorldStore.setState({ worldPermission: WorldPermission.Player });
      defineFields(...fields());
      loadEntries(worldEntry());
      renderFields();
      expect(fieldLabels()).toEqual(["Known as", "Look"]);
      expect(
        screen.queryByRole("region", { name: "Guide only" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("gives a whole row only to Full width Text", () => {
      const select = (multiple: boolean) =>
        field({
          type: WorldFieldType.Select,
          configuration: createWorldFieldConfiguration({
            multiple,
            allowOther: true,
          }),
        });
      expect(isWorldEntryFieldFullRow(field())).toBe(false);
      expect(
        isWorldEntryFieldFullRow(
          field({
            configuration: createWorldFieldConfiguration({ fullWidth: true }),
          }),
        ),
      ).toBe(true);
      expect(isWorldEntryFieldFullRow(select(false))).toBe(false);
      expect(isWorldEntryFieldFullRow(select(true))).toBe(false);
      expect(
        isWorldEntryFieldFullRow(
          linkedEntry(PEOPLE, { id: "home" }, { multiple: true }),
        ),
      ).toBe(false);
    });
  });

  describe("read-only", () => {
    it("shows stored values without inputs, links linked entries, and leaves out empty fields", async () => {
      defineFields(
        field({ id: "climate", label: "Climate" }),
        field({ id: "empty", label: "Empty", sortOrder: 1 }),
        optionList(
          { id: "tags", label: "Tags", sortOrder: 2 },
          { multiple: true },
        ),
        linkedEntry(PEOPLE, { id: "home", label: "Leader", sortOrder: 3 }),
        linkedEntry(PEOPLE, { id: "lost", label: "Lost link", sortOrder: 4 }),
      );
      loadEntries(
        worldEntry(),
        worldEntry({ id: "kell", categoryId: PEOPLE, name: "Kell" }),
      );
      storeValue("entry-1", "climate", "Cold");
      storeValue("entry-1", "tags", ["Coastal", "Haunted"]);
      storeValue("entry-1", "home", "kell");
      storeValue("entry-1", "lost", "unreadable");
      renderFields({ canEdit: false });

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        within(screen.getByRole("group", { name: "Climate" })).getByText(
          "Cold",
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("group", { name: "Tags" })).getByText(
          "Haunted",
        ),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("group", { name: "Leader" })).getByRole(
          "link",
          { name: "Kell" },
        ),
      ).toHaveAttribute(
        "href",
        getWorldViewPath(category.worldId, {
          type: "entry",
          categoryId: PEOPLE,
          entryId: "kell",
        }),
      );
      expect(
        screen.queryByRole("group", { name: "Empty" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("group", { name: "Lost link" }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("oracle rolls", () => {
  const goals = oracle("starforged/character/goal", ["Escape the past"]);
  const types = oracle("starforged/faction/type", ["Guild"]);
  const bound = (id: string) => ({
    packageId: "starforged",
    oracleId: id,
    resolvedOracleId: id,
  });
  const goal = field({ id: "goal", label: "Goal", binding: bound(goals._id) });
  const factionType = optionList(
    {
      id: "type",
      label: "Faction Type",
      sortOrder: 1,
      binding: bound(types._id),
    },
    { suggestions: ["Dominion", "Guild"], allowOther: false },
  );
  const notes = field({ id: "notes", label: "Notes", sortOrder: 2 });

  beforeEach(() => {
    useWorldOraclesStore.setState({
      worldId: category.worldId,
      catalog: catalogOf(goals, types),
      loading: false,
    });
  });

  it("offers dice only on fields bound to an oracle the world can roll", () => {
    defineFields(goal, factionType, notes);
    loadEntries(worldEntry());
    renderFields();
    expect(screen.getByRole("button", { name: "Roll Goal" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Roll Faction Type" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Roll Notes" }),
    ).not.toBeInTheDocument();
  });

  it("fills a Text field and picks a list's option", async () => {
    const user = setupUserWithFakeTimers();
    defineFields(goal, factionType);
    loadEntries(worldEntry());
    renderFields();
    await user.click(screen.getByRole("button", { name: "Roll Goal" }));
    expect(screen.getByRole("textbox", { name: "Goal" })).toHaveValue(
      "Escape the past",
    );
    await passSaveDelay();
    expect(setValue).toHaveBeenCalledWith(
      "entry-1",
      category.worldId,
      "goal",
      "Escape the past",
    );
    await user.click(screen.getByRole("button", { name: "Roll Faction Type" }));
    await passSaveDelay();
    expect(setValue).toHaveBeenCalledWith(
      "entry-1",
      category.worldId,
      "type",
      "Guild",
    );
  });

  it("saves quick rolls once, and keeps showing the last one meanwhile", async () => {
    const user = setupUserWithFakeTimers();
    defineFields(goal);
    loadEntries(worldEntry());
    storeValue("entry-1", "goal", "Revenge");
    renderFields();
    const input = screen.getByRole("textbox", { name: "Goal" });

    await user.click(screen.getByRole("button", { name: "Roll Goal" }));
    await user.click(screen.getByRole("button", { name: "Roll Goal" }));
    // An earlier save's change arriving late does not replace the roll.
    act(() => storeValue("entry-1", "goal", "Find a home"));
    expect(input).toHaveValue("Escape the past");

    await passSaveDelay();
    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith(
      "entry-1",
      category.worldId,
      "goal",
      "Escape the past",
    );
  });

  it("offers no dice to readers or before the oracles load", () => {
    defineFields(goal);
    loadEntries(worldEntry());
    storeValue("entry-1", "goal", "Revenge");
    const view = renderFields({ canEdit: false });
    expect(
      screen.queryByRole("button", { name: "Roll Goal" }),
    ).not.toBeInTheDocument();
    view.unmount();
    useWorldOraclesStore.setState({ catalog: null });
    renderFields();
    expect(
      screen.queryByRole("button", { name: "Roll Goal" }),
    ).not.toBeInTheDocument();
  });
});
