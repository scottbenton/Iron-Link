import { afterEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import { saveMergedRichText } from "components/RichTextEditor/saveMergedRichText";

import { uint8ArrayToBytea } from "lib/bytea.lib";

import {
  NO_SECRETS_VERSION,
  RichTextSecretsService,
} from "../richTextSecrets.service";

const repo = vi.hoisted(() => ({
  read: vi.fn(),
  create: vi.fn(),
  writeIfUnchanged: vi.fn(),
  writeIfUnchangedBeacon: vi.fn(),
  listMentioning: vi.fn(),
}));
vi.mock("repositories/richTextSecrets.repository", () => ({
  RichTextSecretsRepository: repo,
}));

afterEach(() => {
  vi.clearAllMocks();
});

const surface = { noteId: "note" };

function docWith(text: string) {
  const doc = new Y.Doc();
  doc.getText("t").insert(0, text);
  return doc;
}

describe("RichTextSecretsService.createStore", () => {
  it("creates the row on the first save, with the text and mentions", async () => {
    repo.read.mockResolvedValue(null);
    repo.create.mockResolvedValue("v1");
    const store = RichTextSecretsService.createStore(
      surface,
      () => "token",
      () => ({ mentioned_entry_ids: ["entry"] }),
    );

    await expect(
      saveMergedRichText(docWith("secret"), store, () => "secret", undefined),
    ).resolves.toBe("v1");
    expect(repo.create).toHaveBeenCalledWith(
      surface,
      expect.objectContaining({
        content_text: "secret",
        mentioned_entry_ids: ["entry"],
      }),
    );
    expect(repo.writeIfUnchanged).not.toHaveBeenCalled();
  });

  it("merges with another Guide's row when they created it first", async () => {
    const theirs = docWith("theirs");
    repo.read.mockResolvedValueOnce(null).mockResolvedValueOnce({
      content: uint8ArrayToBytea(Y.encodeStateAsUpdate(theirs)),
      updatedAt: "v1",
    });
    repo.create.mockResolvedValue(null);
    repo.writeIfUnchanged.mockResolvedValue("v2");
    const mine = docWith("mine");
    const store = RichTextSecretsService.createStore(surface, () => "token");

    await expect(
      saveMergedRichText(mine, store, () => "", undefined),
    ).resolves.toBe("v2");
    // Read again in full, since there was no version to compare with.
    expect(repo.read).toHaveBeenLastCalledWith(surface, undefined);
    expect(repo.writeIfUnchanged).toHaveBeenCalledWith(
      surface,
      expect.anything(),
      "v1",
    );
    const text = mine.getText("t").toString();
    expect(text).toContain("mine");
    expect(text).toContain("theirs");
  });

  it("updates a row at the version it read", async () => {
    repo.read.mockResolvedValue({ updatedAt: "v3", unchanged: true });
    repo.writeIfUnchanged.mockResolvedValue("v4");
    const store = RichTextSecretsService.createStore(surface, () => "token");

    await expect(store.read("v3")).resolves.toEqual({ updatedAt: "v3" });
    await expect(store.write(new Uint8Array([1]), "", "v3")).resolves.toBe(
      "v4",
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("sends an unload save only for an existing row", () => {
    const store = RichTextSecretsService.createStore(surface, () => "token");
    store.writeBeacon(new Uint8Array([1]), "", NO_SECRETS_VERSION);
    expect(repo.writeIfUnchangedBeacon).not.toHaveBeenCalled();
    store.writeBeacon(new Uint8Array([1]), "", "v1");
    expect(repo.writeIfUnchangedBeacon).toHaveBeenCalledWith(
      "token",
      surface,
      expect.anything(),
      "v1",
    );
  });
});

describe("RichTextSecretsService.listMentioning", () => {
  it("names each surface whose secrets mention the target", async () => {
    repo.listMentioning.mockResolvedValue([
      { note_id: "note", world_entry_id: null, world_id: null },
      { note_id: null, world_entry_id: "entry", world_id: null },
      { note_id: null, world_entry_id: null, world_id: "world" },
    ]);
    await expect(
      RichTextSecretsService.listMentioning({ entryId: "target" }),
    ).resolves.toEqual([
      { noteId: "note" },
      { worldEntryId: "entry" },
      { worldId: "world" },
    ]);
  });
});
