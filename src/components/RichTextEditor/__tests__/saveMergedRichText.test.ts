import { describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import type { RichTextContentStore } from "services/richTextContent.service";

import {
  clearUnsavedState,
  readUnsavedState,
  saveMergedRichText,
  stashUnsavedState,
} from "../saveMergedRichText";

// A stored document guarded by its version, like a row and its updated_at.
function createStoredDocument(initial?: Uint8Array) {
  const row = { content: initial, version: 1 };
  const store: RichTextContentStore = {
    read: vi.fn(async (known) => ({
      updatedAt: `v${row.version}`,
      content: known === `v${row.version}` ? undefined : row.content,
    })),
    write: vi.fn(async (content, _text, expected) => {
      if (expected !== `v${row.version}`) return null;
      row.content = content;
      row.version++;
      return `v${row.version}`;
    }),
    writeBeacon: vi.fn(),
  };
  return { row, store };
}

function text(doc: Y.Doc) {
  return doc.getText("notes").toString();
}

function openCopy(content: Uint8Array | undefined) {
  const doc = new Y.Doc();
  if (content) Y.applyUpdate(doc, content);
  return doc;
}

describe("saveMergedRichText", () => {
  it.each([
    ["first", "second"],
    ["second", "first"],
  ])(
    "keeps both people's offline edits when the %s saves first",
    async (firstSaver) => {
      const base = new Y.Doc();
      base.getText("notes").insert(0, "Camp.");
      const { row, store } = createStoredDocument(Y.encodeStateAsUpdate(base));

      // Two people open the note, then edit without a live connection.
      const first = openCopy(row.content);
      const second = openCopy(row.content);
      first.getText("notes").insert(0, "Dawn. ");
      second.getText("notes").insert(5, " Wolves howl.");

      const [a, b] = firstSaver === "first" ? [first, second] : [second, first];
      const aVersion = await saveMergedRichText(a, store, () => "", undefined);
      await saveMergedRichText(b, store, () => "", undefined);
      // The earlier saver's next save picks up the later one's edits.
      await saveMergedRichText(a, store, () => "", aVersion);

      const reloaded = openCopy(row.content);
      expect(text(reloaded)).toBe("Dawn. Camp. Wolves howl.");
      expect(text(first)).toBe(text(reloaded));
      expect(text(second)).toBe(text(reloaded));
    },
  );

  it("retries when someone saves between its read and its write", async () => {
    const { row, store } = createStoredDocument();
    const other = new Y.Doc();
    other.getText("notes").insert(0, "Theirs. ");
    const read = store.read;
    vi.mocked(store.read).mockImplementationOnce(async (known) => {
      const stored = await read(known);
      // Another save lands after this client read.
      row.content = Y.encodeStateAsUpdate(other);
      row.version++;
      return stored;
    });

    const doc = new Y.Doc();
    doc.getText("notes").insert(0, "Mine.");
    await saveMergedRichText(doc, store, () => "", undefined);

    expect(store.write).toHaveBeenCalledTimes(2);
    expect(text(openCopy(row.content))).toContain("Theirs. ");
    expect(text(openCopy(row.content))).toContain("Mine.");
  });

  it("skips downloading a version it already holds", async () => {
    const { store } = createStoredDocument();
    const doc = new Y.Doc();
    doc.getText("notes").insert(0, "One.");
    const version = await saveMergedRichText(doc, store, () => "", undefined);
    doc.getText("notes").insert(4, " Two.");
    await saveMergedRichText(doc, store, () => "", version);

    expect(store.read).toHaveBeenLastCalledWith(version);
    await expect(vi.mocked(store.read).mock.results[1].value).resolves.toEqual({
      updatedAt: version,
      content: undefined,
    });
  });

  it("gives up rather than looping on a write that never lands", async () => {
    const { store } = createStoredDocument();
    vi.mocked(store.write).mockResolvedValue(null);
    await expect(
      saveMergedRichText(new Y.Doc(), store, () => "", undefined),
    ).rejects.toThrow();
    expect(store.write).toHaveBeenCalledTimes(5);
  });

  it("writes the searchable text with the merged state", async () => {
    const { store } = createStoredDocument();
    await saveMergedRichText(new Y.Doc(), store, () => "Camp", undefined);
    expect(store.write).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      "Camp",
      "v1",
    );
  });
});

describe("unsaved state", () => {
  it("keeps a document's state per user until it is cleared", () => {
    const doc = new Y.Doc();
    doc.getText("notes").insert(0, "Unsaved");
    stashUnsavedState("user-1", "note-1", doc);

    expect(readUnsavedState("user-2", "note-1")).toBeNull();
    expect(text(openCopy(readUnsavedState("user-1", "note-1")!))).toBe(
      "Unsaved",
    );
    clearUnsavedState("user-1", "note-1");
    expect(readUnsavedState("user-1", "note-1")).toBeNull();
  });
});
