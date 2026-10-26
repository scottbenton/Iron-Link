import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";

import { SecretBlocksExtension } from "../SecretBlocksExtension";
import { toGuideImageSrc } from "../guideImages";
import { SecretsController } from "../secretsController";
import {
  getSecretBlocks,
  getSecretsMentions,
  getSecretsText,
} from "../secretsDocument";

vi.mock("services/richTextSecrets.service", () => ({
  RichTextSecretsService: { getImageUrl: vi.fn() },
}));

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;
globalThis.ClipboardEvent ??=
  class extends Event {} as unknown as typeof ClipboardEvent;

const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach((fn) => fn());
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let nextId = 0;

// A Guide's shared editor with secrets, and a player's copy of the same note
// in one live room. The player's editor has no secrets extension.
async function setup() {
  const guideDoc = new Y.Doc();
  const playerDoc = new Y.Doc();
  guideDoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") Y.applyUpdate(playerDoc, update, "remote");
  });
  playerDoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") Y.applyUpdate(guideDoc, update, "remote");
  });
  const companion = new Y.Doc();
  const extensions = [StarterKit.configure({ history: false }), Image];
  const controller = new SecretsController({
    companion,
    userId: "guide",
    blockExtensions: extensions,
    createId: () => `block-${++nextId}`,
  });
  const onGuideImagesRefused = vi.fn();
  const element = document.createElement("div");
  document.body.appendChild(element);
  const shared = new Editor({
    element,
    extensions: [
      ...extensions,
      Collaboration.configure({ document: guideDoc }),
      SecretBlocksExtension.configure({
        getController: () => controller,
        onGuideImagesRefused,
      }),
    ],
  });
  const player = new Editor({
    element: document.createElement("div"),
    extensions: [
      ...extensions,
      Collaboration.configure({ document: playerDoc }),
    ],
  });
  cleanup.push(() => {
    controller.destroy();
    shared.destroy();
    player.destroy();
    element.remove();
  });
  shared.commands.setContent("<p>One</p><p>Two</p><p>Three</p>");
  // The controller works with the @tiptap/react editor type, which is the
  // core editor plus React's renderer.
  controller.attachShared(shared as never);
  await flush();
  return {
    guideDoc,
    playerDoc,
    companion,
    controller,
    shared,
    player,
    onGuideImagesRefused,
  };
}

// The top-level children of the Guide's editor, with blocks by id.
function readingOrder(shared: Editor) {
  return Array.from(shared.view.dom.children).map((child) =>
    child instanceof HTMLElement && child.dataset.secretBlockId
      ? `[${child.dataset.secretBlockId}]`
      : (child.textContent ?? ""),
  );
}

function caretAtEndOf(shared: Editor, index: number) {
  let pos = 0;
  for (let i = 0; i <= index; i++) pos += shared.state.doc.child(i).nodeSize;
  shared.commands.setTextSelection(pos - 1);
}

describe("SecretsController", () => {
  it("inserts a block after the caret's top-level node", async () => {
    const { controller, shared } = await setup();
    caretAtEndOf(shared, 0);
    const id = controller.insertSecret();
    await flush();
    expect(readingOrder(shared)).toEqual(["One", `[${id}]`, "Two", "Three"]);
  });

  it("never sends a secret's text or its existence to players", async () => {
    const { controller, shared, player, playerDoc, companion } = await setup();
    caretAtEndOf(shared, 1);
    const id = controller.insertSecret()!;
    await flush();
    controller.getBlock(id)!.editor.commands.insertContent("the duke is a spy");
    await flush();

    expect(getSecretsText(companion)).toBe("the duke is a spy");
    const playerBytes = new TextDecoder().decode(
      Y.encodeStateAsUpdate(playerDoc),
    );
    expect(playerBytes).not.toContain("duke");
    expect(playerBytes).not.toContain(id);
    expect(player.getHTML()).toBe("<p>One</p><p>Two</p><p>Three</p>");
  });

  it("orders blocks at one boundary by when they were made", async () => {
    const { controller, shared } = await setup();
    caretAtEndOf(shared, 0);
    const first = controller.insertSecret();
    shared.commands.focus();
    caretAtEndOf(shared, 0);
    const second = controller.insertSecret();
    await flush();
    expect(readingOrder(shared)).toEqual([
      "One",
      `[${first}]`,
      `[${second}]`,
      "Two",
      "Three",
    ]);
  });

  it("marks a deleted block and brings it back on undo", async () => {
    const { controller, shared, companion } = await setup();
    caretAtEndOf(shared, 0);
    const id = controller.insertSecret()!;
    await flush();
    controller.getBlock(id)!.editor.commands.insertContent("kept");
    await flush();

    controller.deleteBlock(id);
    await flush();
    expect(readingOrder(shared)).toEqual(["One", "Two", "Three"]);
    expect(getSecretBlocks(companion).get(id)?.get("deletedAt")).toEqual(
      expect.any(Number),
    );

    expect(controller.undo.undo()).toBe(true);
    await flush();
    expect(readingOrder(shared)).toEqual(["One", `[${id}]`, "Two", "Three"]);
    expect(getSecretsText(companion)).toBe("kept");
  });

  it("undoes whichever document took the last change", async () => {
    const { controller, shared } = await setup();
    caretAtEndOf(shared, 0);
    const id = controller.insertSecret()!;
    await flush();
    // A pause, so the next change is its own undo step.
    controller.undo.undo();
    controller.undo.redo();
    await flush();
    shared.commands.focus();
    caretAtEndOf(shared, 2);
    shared.commands.insertContent(" more");
    await flush();
    expect(shared.getText()).toContain("Three more");

    // The note's edit was last, so it goes first, then the block.
    controller.undo.undo();
    await flush();
    expect(shared.getText()).not.toContain("more");
    expect(readingOrder(shared)).toContain(`[${id}]`);
    controller.undo.undo();
    await flush();
    expect(readingOrder(shared)).not.toContain(`[${id}]`);

    // And redo puts them back in the same order.
    controller.undo.redo();
    await flush();
    expect(readingOrder(shared)).toContain(`[${id}]`);
    expect(shared.getText()).not.toContain("more");
    controller.undo.redo();
    await flush();
    expect(shared.getText()).toContain("Three more");
  });

  it("moves selected text into a block", async () => {
    const { controller, shared, playerDoc, companion } = await setup();
    // Select "Two".
    const start = shared.state.doc.child(0).nodeSize + 1;
    shared.commands.setTextSelection({ from: start, to: start + 3 });
    const id = controller.makeSecret();
    await flush();
    expect(id).not.toBeNull();
    expect(getSecretsText(companion)).toBe("Two");
    expect(shared.getText()).not.toContain("Two");
    // Deleted text is collected, so later loads of the note don't hold it.
    expect(
      new TextDecoder().decode(Y.encodeStateAsUpdate(playerDoc)),
    ).not.toContain("Two");
  });

  it("follows a block when the note around it changes", async () => {
    const { controller, shared, player } = await setup();
    caretAtEndOf(shared, 1);
    const id = controller.insertSecret();
    await flush();
    // A player deletes the paragraph below the block and adds one at the top.
    let pos = 0;
    for (let i = 0; i < 2; i++) pos += player.state.doc.child(i).nodeSize;
    player.commands.deleteRange({
      from: pos,
      to: pos + player.state.doc.child(2).nodeSize,
    });
    player.commands.insertContentAt(0, "<p>Zero</p>");
    await flush();
    expect(readingOrder(shared)).toEqual(["Zero", "One", "Two", `[${id}]`]);
  });

  it("lists what the blocks mention", async () => {
    const { companion } = await setup();
    companion.transact(() => {
      const meta = new Y.Map();
      meta.set("createdAt", 1);
      getSecretBlocks(companion).set("b", meta);
      const paragraph = new Y.XmlElement("paragraph");
      const note = new Y.XmlElement("mention");
      note.setAttribute("id", "note-1");
      note.setAttribute("kind", "note");
      const entry = new Y.XmlElement("mention");
      entry.setAttribute("id", "entry-1");
      entry.setAttribute("kind", "worldEntry");
      paragraph.insert(0, [note, entry]);
      companion.getXmlFragment("b").insert(0, [paragraph]);
    });
    expect(getSecretsMentions(companion)).toEqual({
      mentioned_note_ids: ["note-1"],
      mentioned_entry_ids: ["entry-1"],
    });
  });

  it("drops images from a secret pasted into the note", async () => {
    const { shared, onGuideImagesRefused } = await setup();
    shared.commands.focus("end");
    const src = toGuideImageSrc("notes/n/one.png");
    shared.view.pasteHTML(`<p>text</p><img src="${src}">`);
    expect(onGuideImagesRefused).toHaveBeenCalled();
    expect(shared.getHTML()).not.toContain("guide-image:");
    expect(shared.getText()).toContain("text");

    onGuideImagesRefused.mockClear();
    shared.view.pasteHTML(`<img src="https://example.com/a.png">`);
    expect(onGuideImagesRefused).not.toHaveBeenCalled();
    expect(shared.getHTML()).toContain("https://example.com/a.png");
  });
});
