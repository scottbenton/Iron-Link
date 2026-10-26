import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Editor, Extension, Extensions } from "@tiptap/react";
import {
  prosemirrorJSONToYXmlFragment,
  ySyncPlugin,
  ySyncPluginKey,
  yUndoPluginKey,
} from "y-prosemirror";
import * as Y from "yjs";

import { topLevelIndexToPos } from "./secretAnchors";
import {
  PlacedSecretBlock,
  addSecretBlock,
  deleteSecretBlock,
  getSecretBlockFragment,
  getSecretBlocks,
  placeSecretBlocks,
  secretsEditOrigin,
} from "./secretsDocument";
import { UndoCoordinator } from "./undoCoordinator";

export interface SecretBlockView {
  id: string;
  // The widget's element in the shared editor, which the block renders into.
  dom: HTMLElement;
  editor: Editor;
}

export interface SecretsControllerOptions {
  companion: Y.Doc;
  userId: string | undefined;
  // The extensions every rich text editor shares (formatting, images,
  // mentions), for the editors inside blocks.
  blockExtensions: Extensions;
  // A Guide who can't edit the surface reads its secrets but changes nothing:
  // blocks aren't editable, none are added or deleted, and anchors aren't
  // rewritten.
  readOnly?: boolean;
  createId?: () => string;
}

type Listener = () => void;

// Runs a Guide's secrets for one surface: places each block of the companion
// document in the shared editor, owns one editor per block, keeps track of
// which editor has focus for the toolbar, moves the caret between the note and
// blocks, and routes undo. The shared editor gets it through
// SecretBlocksExtension; React reads it through subscribe/getSnapshot.
export class SecretsController {
  public readonly companion: Y.Doc;
  public readonly undo = new UndoCoordinator();
  private readonly companionUndo: Y.UndoManager;
  private readonly options: SecretsControllerOptions;

  private shared: Editor | null = null;
  private blocks = new Map<string, SecretBlockView>();
  private placed: PlacedSecretBlock[] = [];
  private activeBlockId: string | null = null;
  private pendingFocus: { id: string; where: "start" | "end" } | null = null;
  private listeners = new Set<Listener>();
  private snapshot = { version: 0, activeBlockId: null as string | null };
  private destroyed = false;

  constructor(options: SecretsControllerOptions) {
    this.options = options;
    this.companion = options.companion;
    const blocksMap = getSecretBlocks(this.companion);
    this.companionUndo = new Y.UndoManager([blocksMap], {
      trackedOrigins: new Set([ySyncPluginKey, secretsEditOrigin]),
      captureTransaction: (tr) => tr.meta.get("addToHistory") !== false,
    });
    blocksMap.forEach((_, id) =>
      this.companionUndo.addToScope(getSecretBlockFragment(this.companion, id)),
    );
    this.undo.track("secrets", this.companionUndo);
    blocksMap.observeDeep(this.onCompanionChange);
  }

  // Called by the shared editor's plugin view.
  public attachShared(editor: Editor) {
    this.shared = editor;
    const undoManager = yUndoPluginKey.getState(editor.state)?.undoManager as
      | Y.UndoManager
      | undefined;
    if (undoManager) this.undo.track("shared", undoManager);
    this.refreshDecorations();
  }

  public detachShared(editor: Editor) {
    if (this.shared !== editor) return;
    this.shared = null;
    this.undo.untrack("shared");
  }

  private onCompanionChange = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
    events.forEach((event) => {
      if (event.target === getSecretBlocks(this.companion)) {
        event.changes.keys.forEach((change, id) => {
          if (change.action === "add") {
            this.companionUndo.addToScope(
              getSecretBlockFragment(this.companion, id),
            );
          }
        });
      }
    });
    this.refreshDecorations();
  };

  private refreshDecorations() {
    const shared = this.shared;
    if (!shared || shared.isDestroyed) return;
    // Not inside another editor's dispatch.
    queueMicrotask(() => {
      if (shared.isDestroyed || this.destroyed) return;
      shared.view.dispatch(
        shared.state.tr
          .setMeta(SECRETS_REFRESH_META, true)
          .setMeta("addToHistory", false),
      );
    });
  }

  // Where every live block renders, for the shared editor's decorations.
  // Rewrites stale anchors, since only a Guide's editor builds these, unless
  // this Guide may not edit.
  public place(sharedDoc: Y.Doc, fragment: Y.XmlFragment) {
    this.placed = placeSecretBlocks(this.companion, sharedDoc, fragment, {
      refresh: !this.options.readOnly,
    });
    const live = new Set(this.placed.map((p) => p.id));
    let changed = false;
    this.placed.forEach(({ id }) => {
      if (!this.blocks.has(id)) {
        this.blocks.set(id, this.createBlock(id));
        changed = true;
      }
    });
    this.blocks.forEach((block, id) => {
      if (!live.has(id)) {
        block.editor.destroy();
        this.blocks.delete(id);
        if (this.activeBlockId === id) this.activeBlockId = null;
        changed = true;
      }
    });
    if (changed) this.emit();
    return this.placed;
  }

  public getBlock(id: string) {
    return this.blocks.get(id);
  }

  // Blocks in reading order.
  public getBlocks(): SecretBlockView[] {
    return this.placed.flatMap(({ id }) => {
      const block = this.blocks.get(id);
      return block ? [block] : [];
    });
  }

  public getActiveEditor(): Editor | null {
    return this.activeBlockId
      ? (this.blocks.get(this.activeBlockId)?.editor ?? null)
      : null;
  }

  private createBlock(id: string): SecretBlockView {
    const dom = document.createElement("div");
    dom.className = "secret-block";
    dom.dataset.secretBlockId = id;
    dom.contentEditable = "false";
    const fragment = getSecretBlockFragment(this.companion, id);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const controller = this;
    const editor = new Editor({
      editable: !this.options.readOnly,
      extensions: [
        ...this.options.blockExtensions,
        Extension.create({
          name: "secretBlock",
          addProseMirrorPlugins: () => [ySyncPlugin(fragment)],
          addKeyboardShortcuts() {
            return {
              "Mod-z": () => controller.undo.undo(),
              "Shift-Mod-z": () => controller.undo.redo(),
              "Mod-y": () => controller.undo.redo(),
              ArrowUp: ({ editor }) =>
                controller.leaveIfAtEdge(id, editor, "up"),
              ArrowLeft: ({ editor }) =>
                controller.leaveIfAtEdge(id, editor, "left"),
              ArrowDown: ({ editor }) =>
                controller.leaveIfAtEdge(id, editor, "down"),
              ArrowRight: ({ editor }) =>
                controller.leaveIfAtEdge(id, editor, "right"),
              Backspace: ({ editor }) => {
                if (!editor.isEmpty || !editor.isEditable) return false;
                controller.deleteBlock(id);
                return true;
              },
            };
          },
        }),
      ],
      onFocus: () => this.setActiveBlock(id),
      onBlur: () => {
        // The toolbar keeps acting on the block while it takes a click.
      },
      onTransaction: () => {
        if (this.activeBlockId === id) this.emit();
      },
    });
    return { id, dom, editor };
  }

  public setActiveBlock(id: string | null) {
    if (this.activeBlockId === id) return;
    this.activeBlockId = id;
    this.emit();
  }

  // Called when a block's editor has mounted, to give it focus if it was just
  // inserted or entered with the keyboard.
  public takePendingFocus(id: string) {
    if (this.pendingFocus?.id !== id) return;
    const { where } = this.pendingFocus;
    this.pendingFocus = null;
    this.blocks.get(id)?.editor.commands.focus(where);
  }

  private focusBlock(id: string, where: "start" | "end") {
    const block = this.blocks.get(id);
    if (block && block.dom.isConnected && block.editor.view.dom.isConnected) {
      block.editor.commands.focus(where);
    } else {
      this.pendingFocus = { id, where };
    }
    this.setActiveBlock(id);
  }

  // Up or Left at a block's start, or Down or Right at its end, returns to
  // the note (or the next block at the same boundary).
  private leaveIfAtEdge(
    id: string,
    editor: Editor,
    key: "up" | "left" | "down" | "right",
  ) {
    const { doc } = editor.state;
    const selection = readCaret(editor.view);
    if (!selection.empty) return false;
    const backward = key === "up" || key === "left";
    let atEdge: boolean;
    if (key === "left") {
      atEdge = selection.from <= TextSelection.atStart(doc).from;
    } else if (key === "right") {
      atEdge = selection.from >= TextSelection.atEnd(doc).from;
    } else {
      // On the first or last line of the block.
      const edge = backward
        ? TextSelection.atStart(doc)
        : TextSelection.atEnd(doc);
      atEdge =
        selection.$from.sameParent(edge.$from) &&
        editor.view.endOfTextblock(key);
    }
    if (!atEdge) return false;
    return this.leaveBlock(id, backward ? -1 : 1);
  }

  private leaveBlock(id: string, direction: -1 | 1) {
    const shared = this.shared;
    const at = this.placed.findIndex((p) => p.id === id);
    if (!shared || at < 0) return false;
    const { index } = this.placed[at];
    // Another block at the same boundary comes first.
    const next = this.placed[at + direction];
    if (next && next.index === index) {
      this.focusBlock(next.id, direction > 0 ? "start" : "end");
      return true;
    }
    const doc = shared.state.doc;
    if (direction < 0 && index === 0) return false;
    if (direction > 0 && index >= doc.childCount) return false;
    const pos = topLevelIndexToPos(doc, index) + direction;
    // On focus ProseMirror reads the DOM selection, which is still inside the
    // block, and would map it to the widget's boundary: clear it, focus, then
    // place the caret.
    window.getSelection()?.removeAllRanges();
    shared.view.focus();
    shared.view.dispatch(
      shared.state.tr
        .setSelection(
          TextSelection.near(shared.state.doc.resolve(pos), direction),
        )
        .scrollIntoView(),
    );
    this.setActiveBlock(null);
    return true;
  }

  // Down or Right at the end of the node above a block, or Up or Left at the
  // start of the node below one, moves into the block.
  public enterFromShared(key: "up" | "left" | "down" | "right") {
    const shared = this.shared;
    if (!shared) return false;
    const { state, view } = shared;
    const { $from, empty } = readCaret(view);
    if (!empty || state.doc.childCount === 0) return false;
    const top = $from.index(0);
    const node = state.doc.maybeChild(top);
    if (!node) return false;
    const start = topLevelIndexToPos(state.doc, top);
    const backward = key === "up" || key === "left";
    const edge = backward
      ? TextSelection.near(state.doc.resolve(start + 1), 1)
      : TextSelection.near(state.doc.resolve(start + node.nodeSize - 1), -1);
    const atEdge =
      key === "left" || key === "right"
        ? backward
          ? $from.pos <= edge.from
          : $from.pos >= edge.from
        : $from.sameParent(edge.$from) && view.endOfTextblock(key);
    if (!atEdge) return false;
    if (!backward) {
      const block = this.placed.find((p) => p.index === top + 1);
      if (!block) return false;
      this.focusBlock(block.id, "start");
      return true;
    }
    const before = this.placed.filter((p) => p.index === top);
    if (before.length === 0) return false;
    this.focusBlock(before[before.length - 1].id, "end");
    return true;
  }

  public onSharedFocus() {
    this.setActiveBlock(null);
  }

  // The top-level boundary nearest the caret in the shared note: after the
  // node holding it, or the end of the note when it isn't in the note.
  private getInsertIndex() {
    const shared = this.shared;
    if (!shared) return 0;
    if (this.activeBlockId) {
      const active = this.placed.find((p) => p.id === this.activeBlockId);
      if (active) return active.index;
    }
    const doc = shared.state.doc;
    if (!shared.isFocused && !shared.isEditable) return doc.childCount;
    return Math.min(shared.state.selection.$from.index(0) + 1, doc.childCount);
  }

  private newId() {
    return this.options.createId?.() ?? crypto.randomUUID();
  }

  // Adds an empty block at the caret's boundary and moves the caret into it.
  public insertSecret() {
    if (this.options.readOnly) return null;
    const binding = this.shared && getSharedBinding(this.shared.state);
    if (!binding) return null;
    const id = this.newId();
    const index = this.getInsertIndex();
    this.addBlock(id, binding, index);
    this.focusBlock(id, "start");
    return id;
  }

  // Moves the shared note's selection into a new block. Players who loaded
  // the note or were in its room may already have seen the text.
  public makeSecret() {
    if (this.options.readOnly) return null;
    const shared = this.shared;
    const binding = shared && getSharedBinding(shared.state);
    if (!shared || !binding || shared.state.selection.empty) return null;
    const { from, to } = shared.state.selection;
    const content = getSelectionAsDocument(shared.state.doc, from, to);
    if (!content) return null;
    shared.chain().focus().deleteSelection().run();
    const id = this.newId();
    const index = this.takeEmptyTopLevelNode() ?? this.getInsertIndex();
    this.addBlock(id, binding, index, (blockFragment) => {
      prosemirrorJSONToYXmlFragment(
        shared.schema,
        content.toJSON(),
        blockFragment,
      );
    });
    this.focusBlock(id, "end");
    return id;
  }

  // When moving whole paragraphs leaves the caret in an empty one, removes
  // it so the block takes its place, and returns its index.
  private takeEmptyTopLevelNode() {
    const shared = this.shared;
    if (!shared) return null;
    const { $from } = shared.state.selection;
    const doc = shared.state.doc;
    if ($from.depth !== 1 || $from.parent.content.size > 0) return null;
    if (doc.childCount < 2) return null;
    const index = $from.index(0);
    const start = topLevelIndexToPos(doc, index);
    shared.view.dispatch(
      shared.state.tr.delete(start, start + $from.parent.nodeSize),
    );
    return index;
  }

  private addBlock(
    id: string,
    shared: SharedBinding,
    index: number,
    fill?: (fragment: Y.XmlFragment) => void,
  ) {
    // Later blocks at one boundary sort after earlier ones.
    this.companionUndo.stopCapturing();
    addSecretBlock(this.companion, {
      id,
      shared: shared.fragment,
      index,
      createdBy: this.options.userId,
      fill,
    });
    this.companionUndo.stopCapturing();
    this.place(shared.doc, shared.fragment);
  }

  // Marks a block deleted, so undo brings it back, and returns the caret to
  // the note where the block was.
  public deleteBlock(id: string) {
    if (this.options.readOnly) return;
    const placed = this.placed.find((p) => p.id === id);
    const shared = this.shared;
    this.companionUndo.stopCapturing();
    deleteSecretBlock(this.companion, id);
    this.companionUndo.stopCapturing();
    this.setActiveBlock(null);
    if (shared && placed && shared.isEditable) {
      const doc = shared.state.doc;
      const pos = Math.max(0, topLevelIndexToPos(doc, placed.index) - 1);
      shared.view.focus();
      shared.view.dispatch(
        shared.state.tr.setSelection(
          TextSelection.near(shared.state.doc.resolve(pos), -1),
        ),
      );
    }
  }

  public subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = () => this.snapshot;

  private emit() {
    this.snapshot = {
      version: this.snapshot.version + 1,
      activeBlockId: this.activeBlockId,
    };
    this.listeners.forEach((listener) => listener());
  }

  public destroy() {
    this.destroyed = true;
    getSecretBlocks(this.companion).unobserveDeep(this.onCompanionChange);
    this.blocks.forEach((block) => block.editor.destroy());
    this.blocks.clear();
    this.undo.destroy();
    this.companionUndo.destroy();
    this.listeners.clear();
  }
}

export const SECRETS_REFRESH_META = "secretsRefresh";

// The caret as the DOM has it. ProseMirror reads a selection the browser
// moved (End, Home, a click) a moment later, and an arrow key that reads the
// old one lets the browser's own move carry the caret out of a block.
function readCaret(view: EditorView) {
  const { state } = view;
  const dom =
    "getSelection" in view.root ? (view.root as Document).getSelection() : null;
  if (dom?.focusNode && view.dom.contains(dom.focusNode)) {
    try {
      const head = view.posAtDOM(dom.focusNode, dom.focusOffset);
      const anchor = dom.anchorNode
        ? view.posAtDOM(dom.anchorNode, dom.anchorOffset)
        : head;
      const $from = state.doc.resolve(Math.min(anchor, head));
      return { empty: anchor === head, $from, from: $from.pos };
    } catch {
      // Fall back to ProseMirror's own selection.
    }
  }
  const { selection } = state;
  return {
    empty: selection.empty,
    $from: selection.$from,
    from: selection.from,
  };
}

export interface SharedBinding {
  doc: Y.Doc;
  fragment: Y.XmlFragment;
}

// The shared note's Yjs document and fragment, from its editor's sync plugin.
export function getSharedBinding(state: EditorState): SharedBinding | null {
  const sync = ySyncPluginKey.getState(state);
  const fragment = sync?.type as Y.XmlFragment | undefined;
  const doc = sync?.doc as Y.Doc | undefined;
  return fragment && doc ? { fragment, doc } : null;
}

// The selected part of `doc` as a document of its own, or null when it can't
// be one.
function getSelectionAsDocument(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): ProseMirrorNode | null {
  // From the top, so text inside one paragraph keeps its paragraph.
  const slice = doc.slice(from, to, true);
  try {
    const node = doc.type.createAndFill(null, slice.content);
    return node && node.textContent.trim().length > 0 ? node : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
