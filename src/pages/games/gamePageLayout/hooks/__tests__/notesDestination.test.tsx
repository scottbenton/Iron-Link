import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropsWithChildren, useEffect } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorldView } from "components/worlds/worldNavigation";

import { useNotesStore } from "stores/notes.store";

import {
  getNotesItemLinkProps,
  readNotesDestination,
  writeNotesDestination,
} from "../notesDestination";
import { useSyncOpenNoteItem } from "../useSyncOpenNoteItem";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

beforeEach(() => {
  useNotesStore.getState().reset();
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

function SyncHarness() {
  useSyncOpenNoteItem();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output>{location.pathname + location.search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
      {/* Like the game's character tabs, links to a path with no query. */}
      <button onClick={() => navigate("/games/g/c/b")}>Character B</button>
    </>
  );
}

describe("Notes world destinations", () => {
  it("replaces active destinations, distinguishes category tabs, and closes every destination for a world", () => {
    const store = useNotesStore.getState();
    store.openItemTab({ type: "world", id: "world-a" });
    const first = useNotesStore.getState().openTabId;
    store.openItemTab({
      type: "world",
      id: "world-a",
      worldView: { type: "category", categoryId: "locations" },
    });
    expect(useNotesStore.getState().openTabId).toBe(first);
    expect(useNotesStore.getState().noteTabItems[first!].worldView).toEqual({
      type: "category",
      categoryId: "locations",
    });
    store.openItemTab({
      type: "world",
      id: "world-a",
      worldView: { type: "settings" },
      replaceCurrent: false,
      openInBackground: true,
      disallowDuplicates: true,
    });
    store.openItemTab({
      type: "world",
      id: "world-a",
      worldView: { type: "category", categoryId: "npcs" },
      replaceCurrent: false,
      openInBackground: true,
      disallowDuplicates: true,
    });
    store.openItemTab({
      type: "world",
      id: "world-a",
      worldView: { type: "settings" },
      replaceCurrent: false,
      openInBackground: true,
      disallowDuplicates: true,
    });
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(3);
    store.openItemTab({ type: "folder", id: "notes", replaceCurrent: false });
    store.closeTabsMatching("world", "world-a");
    expect(Object.values(useNotesStore.getState().noteTabItems)).toEqual([
      { type: "folder", itemId: "notes" },
    ]);
  });

  it.each<WorldView>([
    { type: "world" },
    { type: "category", categoryId: "location & sector" },
    { type: "settings" },
    { type: "category-settings", categoryId: "npcs" },
    { type: "entry", categoryId: "locations", entryId: "hollowmere" },
    {
      type: "entry",
      categoryId: "locations",
      entryId: "hollowmere",
      section: "places",
    },
  ])(
    "roundtrips $type $section without overwriting unrelated query parameters",
    (worldView) => {
      const destination = {
        type: "world" as const,
        itemId: "world-a",
        worldView,
      };
      const query = writeNotesDestination(
        new URLSearchParams("dice=1&note-category-id=stale"),
        destination,
      );
      expect(query.get("dice")).toBe("1");
      expect(readNotesDestination(query)).toEqual(destination);
    },
  );

  it.each([
    "note-type=bad&note-id=x",
    "note-type=world&note-id=x&note-world-view=bad",
    "note-type=world&note-id=x&note-world-view=category",
    "note-type=world&note-world-view=settings",
    "note-type=world&note-id=x&note-world-view=entry&note-category-id=locations",
    "note-type=world&note-id=x&note-world-view=entry&note-entry-id=hollowmere",
  ])("rejects invalid URL %s", (query) => {
    expect(readNotesDestination(new URLSearchParams(query))).toBeUndefined();
  });

  it("writes an entry destination's category and entry, and clears a stale entry", () => {
    const entry = writeNotesDestination(new URLSearchParams(), {
      type: "world",
      itemId: "world-a",
      worldView: {
        type: "entry",
        categoryId: "locations",
        entryId: "hollowmere",
      },
    });
    expect(entry.toString()).toBe(
      "note-type=world&note-id=world-a&note-world-view=entry&note-category-id=locations&note-entry-id=hollowmere",
    );
    const category = writeNotesDestination(entry, {
      type: "world",
      itemId: "world-a",
      worldView: { type: "category", categoryId: "locations" },
    });
    expect(category.has("note-entry-id")).toBe(false);
  });

  it("intercepts plain, control, meta and middle clicks as real Notes tabs with usable anchor hrefs", () => {
    const open = vi.fn();
    const item = {
      type: "world" as const,
      itemId: "world-a",
      worldView: { type: "category" as const, categoryId: "locations" },
    };
    render(
      <a
        {...getNotesItemLinkProps(
          "/games/g/c/c",
          new URLSearchParams("dice=1"),
          item,
          open,
        )}
      >
        Locations
      </a>,
    );
    const link = screen.getByRole("link", { name: "Locations" });
    expect(link).toHaveAttribute(
      "href",
      "/games/g/c/c?dice=1&note-type=world&note-id=world-a&note-world-view=category&note-category-id=locations",
    );
    fireEvent.click(link);
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    fireEvent(
      link,
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 1,
      }),
    );
    fireEvent(
      link,
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 2,
      }),
    );
    expect(open.mock.calls.map((call) => call[1])).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });

  it("restores deep URLs, records tab changes, and lets Back restore the previous destination", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/games/g?dice=1&note-type=world&note-id=world-a&note-world-view=category&note-category-id=locations",
        ]}
      >
        <SyncHarness />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        useNotesStore.getState().noteTabItems[
          useNotesStore.getState().openTabId!
        ].worldView,
      ).toEqual({ type: "category", categoryId: "locations" }),
    );
    act(() =>
      useNotesStore.getState().openItemTab({
        type: "world",
        id: "world-a",
        worldView: { type: "category-settings", categoryId: "npcs" },
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "note-world-view=category-settings",
      ),
    );
    expect(screen.getByRole("status")).toHaveTextContent("dice=1");
    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(
        useNotesStore.getState().noteTabItems[
          useNotesStore.getState().openTabId!
        ].worldView,
      ).toEqual({ type: "category", categoryId: "locations" }),
    );
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(1);
  });

  it("keeps the open tab when switching character, and Back returns to the previous character", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={["/games/g/c/a?dice=1&note-type=note&note-id=n1"]}
      >
        <SyncHarness />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(useNotesStore.getState().openTabId).not.toBeNull(),
    );
    const openTabId = useNotesStore.getState().openTabId;

    await user.click(screen.getByRole("button", { name: "Character B" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "/games/g/c/b?note-type=note&note-id=n1",
      ),
    );
    expect(useNotesStore.getState().openTabId).toBe(openTabId);
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "/games/g/c/a?dice=1&note-type=note&note-id=n1",
      ),
    );
    expect(useNotesStore.getState().openTabId).toBe(openTabId);
  });

  it("lands on the default tab after closing the last tab", async () => {
    // Mirrors the Notes section reopening its default folder as soon as no
    // tab is left. It renders below the URL sync, so its effect runs first.
    function DefaultTabHarness() {
      const isSomethingOpen = useNotesStore(
        (store) => store.noteTabOrder.length > 0,
      );
      useEffect(() => {
        if (!isSomethingOpen) {
          useNotesStore.getState().openItemTab({
            type: "folder",
            id: "notes",
            disallowDuplicates: true,
          });
        }
      }, [isSomethingOpen]);
      return null;
    }
    function Harness() {
      useSyncOpenNoteItem();
      const location = useLocation();
      return (
        <>
          <output>{location.search}</output>
          <DefaultTabHarness />
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={["/games/g?note-type=note&note-id=a"]}>
        <Harness />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("note-id=a"),
    );

    act(() => {
      const { closeTab, openTabId } = useNotesStore.getState();
      closeTab(openTabId!);
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("note-id=notes"),
    );
    const { noteTabOrder, openTabId } = useNotesStore.getState();
    expect(noteTabOrder).toHaveLength(1);
    expect(openTabId).toBe(noteTabOrder[0]);
  });

  it("does not create a tab from an invalid destination on initial load", () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter
        initialEntries={[
          "/games/g?note-type=world&note-id=x&note-world-view=category",
        ]}
      >
        {children}
      </MemoryRouter>
    );
    renderHook(useSyncOpenNoteItem, { wrapper });
    expect(useNotesStore.getState().openTabId).toBeNull();
  });
});
