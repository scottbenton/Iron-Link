import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import * as Y from "yjs";

import {
  getSecretBlockFragment,
  placeSecretBlocks,
} from "components/RichTextEditor/secrets/secretsDocument";

import { moveLongTextIntoNotes } from "../longTextMigration";

const extensions = [StarterKit.configure({ history: false }), Image, Mention];
const editors: Editor[] = [];
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});

function editorFor(doc: Y.Doc, field = "default") {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: [
      ...extensions,
      Collaboration.configure({ document: doc, field }),
    ],
  });
  editors.push(editor);
  return editor;
}

// A stored Long text value written in a real editor.
function longText(html: string) {
  const doc = new Y.Doc();
  editorFor(doc).commands.setContent(html);
  return Y.encodeStateAsUpdate(doc);
}

function notesWith(html: string) {
  const doc = new Y.Doc();
  if (html) editorFor(doc).commands.setContent(html);
  return doc;
}

let id = 0;
const createId = () => `secret-${++id}`;

describe("moveLongTextIntoNotes", () => {
  it("appends shared values under their labels, keeping mentions and images", () => {
    const notes = notesWith("<p>Existing notes</p>");
    const result = moveLongTextIntoNotes({
      notes,
      companion: null,
      values: [
        {
          label: "History",
          content: longText(
            '<p>Founded by <span data-type="mention" data-id="entry-1" data-label="Ana"></span></p><img src="https://example.com/a.png">',
          ),
          guideOnly: false,
        },
        { label: "Empty", content: longText("<p></p>"), guideOnly: false },
        { label: "Never written", content: new Uint8Array(), guideOnly: false },
        {
          label: "Customs",
          content: longText("<p><strong>Bow</strong> twice</p>"),
          guideOnly: false,
        },
      ],
      createId,
    });

    expect(result).toEqual({ shared: 2, secrets: 0 });
    // What the next person to open the Notes sees.
    const html = editorFor(notes).getHTML();
    expect(html).toBe(
      "<p>Existing notes</p>" +
        "<h2>History</h2>" +
        '<p>Founded by <span data-type="mention" data-id="entry-1" data-label="Ana">@Ana</span></p>' +
        '<img src="https://example.com/a.png">' +
        "<h2>Customs</h2>" +
        "<p><strong>Bow</strong> twice</p>",
    );
  });

  it("puts Guide only values in secret blocks, in field order, never in the Notes", () => {
    const notes = notesWith("<p>Start</p>");
    const companion = new Y.Doc();
    const result = moveLongTextIntoNotes({
      notes,
      companion,
      values: [
        {
          label: "Public",
          content: longText("<p>Everyone knows</p>"),
          guideOnly: false,
        },
        {
          label: "Secret plans",
          content: longText("<p>The duke is a spy</p>"),
          guideOnly: true,
        },
        {
          label: "Later",
          content: longText("<p>After the secret</p>"),
          guideOnly: false,
        },
      ],
      createId,
    });

    expect(result).toEqual({ shared: 2, secrets: 1 });
    expect(
      new TextDecoder().decode(Y.encodeStateAsUpdate(notes)),
    ).not.toContain("duke");

    const fragment = notes.getXmlFragment("default");
    const [placed] = placeSecretBlocks(companion, notes, fragment);
    // Start, Public heading, its text | secret | Later heading, its text.
    expect(placed.index).toBe(3);
    const block = new Y.Doc();
    Y.applyUpdate(block, Y.encodeStateAsUpdate(companion));
    expect(editorFor(block, placed.id).getHTML()).toBe(
      "<h2>Secret plans</h2><p>The duke is a spy</p>",
    );
    expect(getSecretBlockFragment(companion, placed.id).length).toBe(2);
  });

  it("refuses a Guide only value without a companion document", () => {
    expect(() =>
      moveLongTextIntoNotes({
        notes: notesWith(""),
        companion: null,
        values: [
          { label: "x", content: longText("<p>x</p>"), guideOnly: true },
        ],
      }),
    ).toThrow();
  });

  it("merges with an edit made elsewhere at the same time", () => {
    const notes = notesWith("<p>One</p>");
    const elsewhere = new Y.Doc();
    Y.applyUpdate(elsewhere, Y.encodeStateAsUpdate(notes));
    editorFor(elsewhere).commands.insertContentAt(0, "<p>Zero</p>");

    moveLongTextIntoNotes({
      notes,
      companion: null,
      values: [
        { label: "Lore", content: longText("<p>Old</p>"), guideOnly: false },
      ],
    });
    Y.applyUpdate(notes, Y.encodeStateAsUpdate(elsewhere));
    expect(editorFor(notes).getHTML()).toBe(
      "<p>Zero</p><p>One</p><h2>Lore</h2><p>Old</p>",
    );
  });
});
