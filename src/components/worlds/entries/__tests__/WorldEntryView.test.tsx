import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type WorldNavigation,
  getWorldViewPath,
} from "components/worlds/worldNavigation";

import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import {
  category,
  field,
  linkedEntry,
  translate,
} from "../../categories/__tests__/fixtures";
import { WorldEntryActions } from "../WorldEntryActions";
import { WorldEntryView } from "../WorldEntryView";
import { worldEntry } from "./fixtures";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "author" }));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

// The collaborative editor needs WebRTC; the stand-in shows what it was given.
vi.mock("components/RichTextEditor", () => ({
  RtcRichTextEditor: ({
    id,
    roomPrefix,
    initialValue,
    onSave,
  }: {
    id: string;
    roomPrefix: string;
    initialValue: Uint8Array;
    onSave?: (id: string, value: Uint8Array, text: string) => Promise<void>;
  }) => (
    <div data-testid="rich-text">
      {`${roomPrefix}-${id}: ${initialValue.length} bytes`}
      {onSave && (
        <button onClick={() => onSave(id, new Uint8Array([7, 8]), "text")}>
          Save document
        </button>
      )}
    </div>
  ),
}));

const PEOPLE = "people";

beforeEach(() => {
  vi.restoreAllMocks();
  useWorldEntriesStore.getState().reset();
  useWorldCategoriesStore.setState({ fieldDefinitions: {}, categories: {} });
  useWorldStore.setState({ isGuided: true });
  vi.spyOn(WorldEntriesService, "getWorldEntryNotesContent").mockResolvedValue({
    content: new Uint8Array(),
  });
});

function loadEntries(
  entries: IWorldEntry[],
  permissions: Partial<
    Record<
      string,
      { canEdit: boolean; canDelete: boolean; canChangePermissions: boolean }
    >
  > = {},
) {
  useWorldEntriesStore.setState((store) => {
    store.entryState.loading = false;
    store.entryState.entries = Object.fromEntries(
      entries.map((item) => [item.id, item]),
    );
    store.entryState.permissions = Object.fromEntries(
      entries.map((item) => [
        item.id,
        permissions[item.id] ?? {
          canEdit: true,
          canDelete: true,
          canChangePermissions: true,
        },
      ]),
    );
  });
}

function renderView(entryId = "entry-1", viewCategory = category) {
  const navigate = vi.fn();
  const navigation: WorldNavigation = {
    view: { type: "entry", categoryId: category.id, entryId },
    getLinkProps: (view) => ({
      href: getWorldViewPath(category.worldId, view),
    }),
    navigate,
  };
  render(
    <MemoryRouter>
      <ConfirmProvider>
        <WorldEntryView
          category={viewCategory}
          entryId={entryId}
          navigation={navigation}
        />
      </ConfirmProvider>
    </MemoryRouter>,
  );
  return navigate;
}

function renderActions(
  variant: "strip" | "card",
  { canShare = true, canMove = false, canDelete = true } = {},
) {
  const onDeleted = vi.fn();
  render(
    <ConfirmProvider>
      <WorldEntryActions
        entry={useWorldEntriesStore.getState().entryState.entries["entry-1"]}
        variant={variant}
        categoryName="Locations"
        canShare={canShare}
        canMove={canMove}
        canDelete={canDelete}
        onDeleted={onDeleted}
        onError={vi.fn()}
      />
    </ConfirmProvider>,
  );
  return onDeleted;
}

describe("WorldEntryActions", () => {
  it("names the visible entries that link here before deleting, then returns to the list", async () => {
    const user = userEvent.setup();
    const home = linkedEntry(category.id, {
      id: "home",
      categoryId: PEOPLE,
    });
    const notes = field({ id: "notes", categoryId: PEOPLE });
    useWorldCategoriesStore.setState({ fieldDefinitions: { home, notes } });
    loadEntries([
      worldEntry(),
      worldEntry({ id: "kell", categoryId: PEOPLE, name: "Kell" }),
      worldEntry({ id: "ash", categoryId: PEOPLE, name: "Ash" }),
      worldEntry({ id: "bram", categoryId: PEOPLE, name: "Bram" }),
    ]);
    useWorldEntriesStore.setState((store) => {
      const value = (
        entryId: string,
        fieldDefinitionId: string,
        v: string,
      ) => ({
        entryId,
        fieldDefinitionId,
        worldId: category.worldId,
        gmOnly: false,
        value: v,
      });
      store.fieldValueState.valuesByEntry = {
        kell: { home: value("kell", "home", "entry-1") },
        ash: { home: value("ash", "home", "entry-1") },
        bram: { notes: value("bram", "notes", "entry-1") },
        hidden: { home: value("hidden", "home", "entry-1") },
      };
    });
    const remove = vi
      .spyOn(WorldEntriesService, "deleteWorldEntry")
      .mockResolvedValue();
    const removeFiles = vi
      .spyOn(WorldEntriesService, "deleteWorldEntryFiles")
      .mockResolvedValue();
    const onDeleted = renderActions("strip");

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(
      await screen.findByText(
        'Delete "Hollowmere"? Hollowmere is linked from 2 entries: Ash, Kell. Those links will be removed. This cannot be undone.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(remove).toHaveBeenCalledWith("entry-1");
    expect(removeFiles).toHaveBeenCalledWith(category.worldId, "entry-1");
  });

  it("shows Share in the strip and keeps the rest in More", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry()]);
    renderActions("strip");
    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("puts every action in one menu on a card", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry()]);
    renderActions("card");
    expect(
      screen.queryByRole("button", { name: "Share" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Hollowmere actions" }),
    );
    expect(screen.getByRole("menuitem", { name: "Share" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Delete" }),
    ).toBeInTheDocument();
  });
});

describe("Move to", () => {
  const places = () => [
    worldEntry({ id: "region", name: "The North" }),
    worldEntry({ parentEntryId: "region" }),
    worldEntry({ id: "inn", name: "The Inn", parentEntryId: "entry-1" }),
    worldEntry({ id: "south", name: "The South" }),
    worldEntry({ id: "elsewhere", name: "Kell", categoryId: PEOPLE }),
  ];

  it("offers only valid parents and moves the entry", async () => {
    const user = userEvent.setup();
    const move = vi
      .spyOn(WorldEntriesService, "setWorldEntryParent")
      .mockResolvedValue();
    loadEntries(places());
    renderActions("strip", { canMove: true });
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Move Hollowmere",
    });
    const item = (name: string) =>
      within(dialog).getByRole("treeitem", { name: new RegExp(`^${name}`) });
    expect(item("The North")).toHaveAttribute("aria-selected", "true");
    expect(item("Hollowmere")).toHaveAttribute("aria-disabled", "true");
    expect(item("The Inn")).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).queryByText("Kell")).not.toBeInTheDocument();
    const save = within(dialog).getByRole("button", { name: "Move" });
    expect(save).toBeDisabled();

    await user.click(within(dialog).getByText("The South"));
    await user.click(save);
    expect(move).toHaveBeenCalledWith("entry-1", "south");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("moves an entry to the top of its category", async () => {
    const user = userEvent.setup();
    const move = vi
      .spyOn(WorldEntriesService, "setWorldEntryParent")
      .mockResolvedValue();
    loadEntries(places());
    renderActions("card", { canMove: true });
    await user.click(
      screen.getByRole("button", { name: "Hollowmere actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Move to" }));
    await user.click(await screen.findByText("Top of Locations"));
    await user.click(screen.getByRole("button", { name: "Move" }));
    expect(move).toHaveBeenCalledWith("entry-1", null);
  });

  it("keeps the dialog open when the move is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(WorldEntriesService, "setWorldEntryParent").mockRejectedValue(
      new Error("refused"),
    );
    loadEntries(places());
    renderActions("strip", { canMove: true });
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to" }));
    await user.click(await screen.findByText("The South"));
    const save = screen.getByRole("button", { name: "Move" });
    await user.click(save);
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is not offered where the entry cannot move", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry()]);
    renderActions("strip");
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(
      screen.queryByRole("menuitem", { name: "Move to" }),
    ).not.toBeInTheDocument();
  });
});

describe("entry images", () => {
  function renderStrip() {
    render(
      <ConfirmProvider>
        <WorldEntryActions
          entry={useWorldEntriesStore.getState().entryState.entries["entry-1"]}
          categoryName="Locations"
          canShare={false}
          canEditImage
          canDelete={false}
          onDeleted={vi.fn()}
          onError={vi.fn()}
        />
      </ConfirmProvider>,
    );
  }

  it("uploads a portrait and removes the one it replaces", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry({ imageFilename: "old.png" })]);
    const upload = vi
      .spyOn(WorldEntriesService, "uploadWorldEntryImage")
      .mockResolvedValue({ filename: "new.png", url: "https://x/new.png" });
    const update = vi
      .spyOn(WorldEntriesService, "updateWorldEntry")
      .mockResolvedValue();
    const removeImage = vi
      .spyOn(WorldEntriesService, "deleteWorldEntryImage")
      .mockResolvedValue();
    renderStrip();
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(
      screen.getByRole("menuitem", { name: "Change image" }),
    ).toBeInTheDocument();
    const file = new File(["png"], "map.png", { type: "image/png" });
    await user.upload(screen.getByTestId("world-entry-image-input"), file);
    await waitFor(() =>
      expect(removeImage).toHaveBeenCalledWith(
        category.worldId,
        "entry-1",
        "old.png",
      ),
    );
    expect(upload).toHaveBeenCalledWith(category.worldId, "entry-1", file);
    expect(update).toHaveBeenCalledWith("entry-1", {
      imageFilename: "new.png",
    });
  });

  it("offers Add image in More when there is no portrait", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry()]);
    renderStrip();
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(
      screen.getByRole("menuitem", { name: "Add image" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Remove image" }),
    ).not.toBeInTheDocument();
  });

  it("removes the portrait", async () => {
    const user = userEvent.setup();
    loadEntries([worldEntry({ imageFilename: "old.png" })]);
    const update = vi
      .spyOn(WorldEntriesService, "updateWorldEntry")
      .mockResolvedValue();
    const removeImage = vi
      .spyOn(WorldEntriesService, "deleteWorldEntryImage")
      .mockResolvedValue();
    renderStrip();
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove image" }));
    await waitFor(() => expect(removeImage).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith("entry-1", { imageFilename: null });
  });
});

describe("entry Notes", () => {
  it("edits Notes collaboratively below the fields", async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(WorldEntriesService, "updateWorldEntryNotesContent")
      .mockResolvedValue();
    loadEntries([worldEntry()]);
    renderView();
    const notes = await screen.findByRole("region", { name: "Notes" });
    expect(within(notes).getByTestId("rich-text")).toHaveTextContent(
      `world-entry-notes-${category.worldId}-entry-1: 0 bytes`,
    );
    await user.click(
      within(notes).getByRole("button", { name: "Save document" }),
    );
    expect(save).toHaveBeenCalledWith("entry-1", new Uint8Array([7, 8]));
  });

  it("shows readers the notes without saving", async () => {
    const readOnly = {
      canEdit: false,
      canDelete: false,
      canChangePermissions: false,
    };
    loadEntries([worldEntry()], { "entry-1": readOnly });
    vi.mocked(WorldEntriesService.getWorldEntryNotesContent).mockResolvedValue({
      content: new Uint8Array([1, 2, 3]),
    });
    renderView();
    const notes = await screen.findByRole("region", { name: "Notes" });
    expect(within(notes).getByTestId("rich-text")).toHaveTextContent("3 bytes");
    expect(
      within(notes).queryByRole("button", { name: "Save document" }),
    ).not.toBeInTheDocument();
  });

  it("hides empty Notes from readers", async () => {
    const load = vi.mocked(WorldEntriesService.getWorldEntryNotesContent);
    loadEntries([worldEntry()], {
      "entry-1": {
        canEdit: false,
        canDelete: false,
        canChangePermissions: false,
      },
    });
    renderView();
    await waitFor(() => expect(load).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Notes" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the entry's portrait in its header", () => {
    vi.spyOn(WorldEntriesService, "getWorldEntryImageUrl").mockImplementation(
      (worldId, entryId, filename) =>
        `https://x/${worldId}/${entryId}/${filename}`,
    );
    loadEntries([worldEntry({ imageFilename: "face.png" })]);
    const { container } = render(
      <MemoryRouter>
        <ConfirmProvider>
          <WorldEntryView
            category={category}
            entryId="entry-1"
            navigation={{
              view: {
                type: "entry",
                categoryId: category.id,
                entryId: "entry-1",
              },
              getLinkProps: () => ({ href: "/" }),
              navigate: vi.fn(),
            }}
          />
        </ConfirmProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      `${category.worldId}/entry-1/face.png`,
    );
  });
});

describe("WorldEntryView", () => {
  it("shows the subtitle under the name", () => {
    const role = field({ id: "role", label: "Role" });
    useWorldCategoriesStore.setState({ fieldDefinitions: { role } });
    loadEntries([worldEntry()]);
    useWorldEntriesStore.setState((store) => {
      store.fieldValueState.valuesByEntry = {
        "entry-1": {
          role: {
            entryId: "entry-1",
            fieldDefinitionId: "role",
            worldId: category.worldId,
            gmOnly: false,
            value: "Mystic",
          },
        },
      };
    });
    renderView(undefined, { ...category, subtitleFieldDefinitionId: "role" });
    expect(screen.getByText("Mystic", { selector: "p" })).toBeInTheDocument();
  });

  it("shows the entry read-only to anyone who cannot edit it", () => {
    loadEntries([worldEntry()], {
      "entry-1": {
        canEdit: false,
        canDelete: false,
        canChangePermissions: false,
      },
    });
    renderView();
    expect(
      screen.getByRole("heading", { name: "Hollowmere" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renames the entry in place", async () => {
    const user = userEvent.setup();
    const update = vi
      .spyOn(WorldEntriesService, "updateWorldEntry")
      .mockResolvedValue();
    loadEntries([worldEntry()]);
    renderView();
    const name = screen.getByRole("textbox", { name: "Name" });
    await user.clear(name);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An entry needs a name.",
    );
    await user.type(name, "Hollowmere Keep");
    await waitFor(
      () =>
        expect(update).toHaveBeenCalledWith("entry-1", {
          name: "Hollowmere Keep",
        }),
      { timeout: 3000 },
    );
  });

  it("explains a missing or unreadable entry and links back to the list", () => {
    loadEntries([worldEntry({ id: "other", categoryId: "elsewhere" })]);
    renderView("other");
    expect(
      screen.getByText(
        "This entry was deleted, or you do not have access to it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Locations" }),
    ).toHaveAttribute(
      "href",
      getWorldViewPath(category.worldId, {
        type: "category",
        categoryId: category.id,
      }),
    );
  });
});
