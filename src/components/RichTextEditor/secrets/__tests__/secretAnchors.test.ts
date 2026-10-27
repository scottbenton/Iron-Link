import { Editor } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import * as Y from "yjs";

import {
  createSecretAnchor,
  isSecretAnchorStale,
  resolveSecretAnchor,
} from "../secretAnchors";

const editors: Editor[] = [];
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});

function makeEditor(doc: Y.Doc) {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: doc }),
    ],
  });
  editors.push(editor);
  return editor;
}

// Two copies of a note in one live room: the Guide's and a player's.
function makeRoom(gc = true) {
  const guideDoc = new Y.Doc({ gc });
  const playerDoc = new Y.Doc({ gc });
  guideDoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") Y.applyUpdate(playerDoc, update, "remote");
  });
  playerDoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "remote") Y.applyUpdate(guideDoc, update, "remote");
  });
  const guide = makeEditor(guideDoc);
  const player = makeEditor(playerDoc);
  guide.commands.setContent(
    Array.from({ length: 6 }, (_, i) => `<p>P${i + 1} text</p>`).join(""),
  );
  return { guideDoc, guide, player };
}

function labels(fragment: Y.XmlFragment) {
  return fragment
    .toArray()
    .map((node) => node.toString().match(/P\d/g)?.join("+") ?? "other");
}

// Who sits either side of top-level index `index`.
function around(fragment: Y.XmlFragment, index: number) {
  const list = labels(fragment);
  return `${list[index - 1] ?? "start"} | ${list[index] ?? "end"}`;
}

function rangeOf(editor: Editor, index: number) {
  let from = 0;
  for (let i = 0; i < index; i++) from += editor.state.doc.child(i).nodeSize;
  return { from, to: from + editor.state.doc.child(index).nodeSize };
}

function textStart(editor: Editor, index: number) {
  return rangeOf(editor, index).from + 1;
}

function textEnd(editor: Editor, index: number) {
  return rangeOf(editor, index).to - 1;
}

const scenarios: {
  name: string;
  expected: string[];
  edit: (player: Editor) => void;
}[] = [
  {
    name: "typing in both neighbours",
    expected: ["P2 | P3"],
    edit: (e) => {
      e.commands.insertContentAt(textEnd(e, 1), " more");
      e.commands.insertContentAt(textEnd(e, 2), " more");
    },
  },
  {
    name: "paragraphs added above",
    expected: ["P2 | P3"],
    edit: (e) => e.commands.insertContentAt(0, "<p>a</p><p>b</p><p>c</p>"),
  },
  {
    name: "the node below deleted",
    expected: ["P2 | P4"],
    edit: (e) => e.commands.deleteRange(rangeOf(e, 2)),
  },
  {
    name: "the node above deleted",
    expected: ["P1 | P3"],
    edit: (e) => e.commands.deleteRange(rangeOf(e, 1)),
  },
  {
    name: "both neighbours deleted",
    expected: ["P1 | P4"],
    edit: (e) =>
      e.commands.deleteRange({
        from: rangeOf(e, 1).from,
        to: rangeOf(e, 2).to,
      }),
  },
  {
    name: "the neighbours merged",
    expected: ["P2+P3 | P4", "P1 | P2+P3"],
    edit: (e) => {
      e.commands.setTextSelection(textStart(e, 2));
      e.commands.joinBackward();
    },
  },
  {
    name: "the node below retyped",
    expected: ["P2 | P3"],
    edit: (e) => {
      e.commands.setTextSelection(textStart(e, 2) + 1);
      e.commands.setHeading({ level: 2 });
    },
  },
  {
    name: "both neighbours retyped",
    expected: ["P2 | P3"],
    edit: (e) => {
      e.commands.setTextSelection(textStart(e, 1) + 1);
      e.commands.setHeading({ level: 2 });
      e.commands.setTextSelection(textStart(e, 2) + 1);
      e.commands.setHeading({ level: 3 });
    },
  },
  {
    name: "Enter at the end of the node above",
    expected: ["other | P3"],
    edit: (e) => {
      e.commands.setTextSelection(textEnd(e, 1));
      e.commands.splitBlock();
      e.commands.insertContent("new line");
    },
  },
];

describe("resolveSecretAnchor", () => {
  describe.each([true, false])("with gc %s", (gc) => {
    it.each(scenarios)(
      "keeps a block in place after $name",
      ({ expected, edit }) => {
        const { guideDoc, player } = makeRoom(gc);
        const fragment = guideDoc.getXmlFragment("default");
        // A block between P2 and P3.
        const anchor = createSecretAnchor(fragment, 2);
        expect(
          around(fragment, resolveSecretAnchor(guideDoc, fragment, anchor)),
        ).toBe("P2 | P3");

        edit(player);
        const index = resolveSecretAnchor(guideDoc, fragment, anchor);
        expect(expected).toContain(around(fragment, index));

        // The same after both documents reload from their stored bytes.
        const reloaded = new Y.Doc({ gc });
        Y.applyUpdate(reloaded, Y.encodeStateAsUpdate(guideDoc));
        const reloadedFragment = reloaded.getXmlFragment("default");
        expect(resolveSecretAnchor(reloaded, reloadedFragment, anchor)).toBe(
          index,
        );
      },
    );
  });

  it("never loses a block when the whole note is replaced", () => {
    const { guideDoc, player } = makeRoom();
    const fragment = guideDoc.getXmlFragment("default");
    const anchor = createSecretAnchor(fragment, 4);
    player.commands.setContent("<p>only this</p>");
    const index = resolveSecretAnchor(guideDoc, fragment, anchor);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThanOrEqual(fragment.length);
  });

  it("keeps blocks placed at the start and the end at the edges", () => {
    const { guideDoc, player } = makeRoom();
    const fragment = guideDoc.getXmlFragment("default");
    const start = createSecretAnchor(fragment, 0);
    const end = createSecretAnchor(fragment, fragment.length);
    player.commands.deleteRange(rangeOf(player, 0));
    player.commands.deleteRange(
      rangeOf(player, player.state.doc.childCount - 1),
    );
    expect(resolveSecretAnchor(guideDoc, fragment, start)).toBe(0);
    expect(resolveSecretAnchor(guideDoc, fragment, end)).toBe(fragment.length);
  });

  it("falls back to the stored index when no neighbour is known", () => {
    const { guideDoc } = makeRoom();
    const fragment = guideDoc.getXmlFragment("default");
    // Neighbours from another document are never received here.
    const other = new Y.Doc().getXmlFragment("default");
    makeEditor(other.doc!).commands.setContent("<p>a</p><p>b</p>");
    expect(
      resolveSecretAnchor(guideDoc, fragment, {
        ...createSecretAnchor(other, 1),
        fallback: 3,
      }),
    ).toBe(3);
    // Or the end of the note, when that index is gone.
    expect(
      resolveSecretAnchor(guideDoc, fragment, {
        ...createSecretAnchor(other, 1),
        fallback: 99,
      }),
    ).toBe(fragment.length);
  });
});

describe("isSecretAnchorStale", () => {
  it("is fresh until a neighbour goes", () => {
    const { guideDoc, player } = makeRoom();
    const fragment = guideDoc.getXmlFragment("default");
    const anchor = createSecretAnchor(fragment, 2);
    expect(isSecretAnchorStale(guideDoc, fragment, anchor, 2)).toBe(false);

    player.commands.insertContentAt(textEnd(player, 1), " typed");
    expect(isSecretAnchorStale(guideDoc, fragment, anchor, 2)).toBe(false);

    player.commands.deleteRange(rangeOf(player, 2));
    const index = resolveSecretAnchor(guideDoc, fragment, anchor);
    expect(isSecretAnchorStale(guideDoc, fragment, anchor, index)).toBe(true);
    expect(
      isSecretAnchorStale(
        guideDoc,
        fragment,
        createSecretAnchor(fragment, index),
        index,
      ),
    ).toBe(false);
  });

  it("waits for a neighbour this copy hasn't received yet", () => {
    const { guideDoc } = makeRoom();
    const fragment = guideDoc.getXmlFragment("default");
    const anchor = createSecretAnchor(fragment, 2);
    // A copy of the note from before any of it was written.
    const empty = new Y.Doc();
    const emptyFragment = empty.getXmlFragment("default");
    expect(isSecretAnchorStale(empty, emptyFragment, anchor, 0)).toBe(false);
  });
});
