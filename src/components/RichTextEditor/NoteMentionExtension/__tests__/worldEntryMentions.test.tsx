import { cleanup, render, screen } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryMention } from "../WorldEntryMention";
import { NoteMentionExtension } from "../extension";
import { WorldEntryMentionLinksContext } from "../worldEntryMentionLinks";
import { findWorldEntryMentionCandidates } from "../worldEntryMentions";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const initialEntryState = useWorldEntriesStore.getState().entryState;

function category(id: string, name: string, sortOrder: number): IWorldCategory {
  return {
    id,
    worldId: "world-1",
    name,
    icon: null,
    sortOrder,
    supportsHierarchy: false,
    supportsMap: false,
    supportsBonds: false,
    subtitleFieldDefinitionId: null,
  };
}

function entry(id: string, name: string, categoryId: string): IWorldEntry {
  return {
    id,
    worldId: "world-1",
    categoryId,
    parentEntryId: null,
    name,
    imageFilename: null,
    icon: null,
    readPermissions: ReadPermissions.AllPlayers,
    editPermissions: EditPermissions.OnlyAuthor,
    authorId: "author",
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

function setEntries(entries: IWorldEntry[], loading = false) {
  useWorldEntriesStore.setState((state) => {
    state.entryState.entries = Object.fromEntries(
      entries.map((item) => [item.id, item]),
    );
    state.entryState.loading = loading;
  });
}

afterEach(() => {
  cleanup();
  useWorldEntriesStore.setState((state) => {
    state.entryState = initialEntryState;
  });
});

describe("findWorldEntryMentionCandidates", () => {
  const categories = {
    places: category("places", "Places", 2),
    people: category("people", "People", 1),
  };
  const entries = {
    a: entry("a", "Ashfall", "places"),
    b: entry("b", "Brannoc", "people"),
    c: entry("c", "Cinder Hold", "places"),
    d: entry("d", "Asha", "people"),
    orphan: entry("orphan", "Ashen", "missing"),
  };

  it("groups matches by category order, then name", () => {
    expect(
      findWorldEntryMentionCandidates(entries, categories, "").map(
        ({ entry }) => entry.id,
      ),
    ).toEqual(["d", "b", "a", "c"]);
  });

  it("matches anywhere in the name, ignoring case", () => {
    expect(
      findWorldEntryMentionCandidates(entries, categories, "AS").map(
        ({ entry }) => entry.id,
      ),
    ).toEqual(["d", "a"]);
    expect(
      findWorldEntryMentionCandidates(entries, categories, "hold").map(
        ({ entry }) => entry.id,
      ),
    ).toEqual(["c"]);
  });

  it("stops at the limit", () => {
    expect(
      findWorldEntryMentionCandidates(entries, categories, "", 2),
    ).toHaveLength(2);
  });
});

describe("world entry mentions", () => {
  it("stores no name and reads the current one", () => {
    setEntries([entry("a", "Ashfall", "places")]);
    const editor = new Editor({
      extensions: [StarterKit, NoteMentionExtension],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "mention",
                attrs: { id: "a", label: null, kind: "worldEntry" },
              },
            ],
          },
        ],
      },
    });

    expect(editor.getText()).toBe("@Ashfall");
    setEntries([entry("a", "Ashfall Ruins", "places")]);
    expect(editor.getText()).toBe("@Ashfall Ruins");
    expect(editor.getJSON().content?.[0].content?.[0].attrs).toMatchObject({
      label: null,
      kind: "worldEntry",
    });

    setEntries([]);
    expect(editor.getText()).toBe("@Unavailable entry");
    expect(editor.getHTML()).not.toContain("Ashfall");
    editor.destroy();
  });

  it("keeps note mentions as they were stored", () => {
    const editor = new Editor({
      extensions: [StarterKit, NoteMentionExtension],
      content:
        '<p><span data-type="mention" data-id="n1" data-label="Session 1">@Session 1</span></p>',
    });
    expect(editor.getJSON().content?.[0].content?.[0].attrs).toMatchObject({
      id: "n1",
      label: "Session 1",
      kind: "note",
    });
    expect(editor.getText()).toBe("@Session 1");
    editor.destroy();
  });

  it("links a readable entry by its current name", () => {
    setEntries([entry("a", "Ashfall", "places")]);
    render(
      <MemoryRouter>
        <WorldEntryMentionLinksContext.Provider
          value={(view) => ({
            href: view.type === "entry" ? `/entry/${view.entryId}` : "/",
          })}
        >
          <WorldEntryMention entryId="a" />
        </WorldEntryMentionLinksContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Ashfall" })).toHaveAttribute(
      "href",
      "/entry/a",
    );
  });

  it("shows an entry this reader cannot see as unavailable", () => {
    setEntries([]);
    render(
      <MemoryRouter>
        <WorldEntryMention entryId="hidden" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Unavailable entry")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("waits for entries before calling one unavailable", () => {
    setEntries([], true);
    render(
      <MemoryRouter>
        <WorldEntryMention entryId="a" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading entry")).toBeInTheDocument();
  });
});
