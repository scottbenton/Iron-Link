import { Fragment, Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

import { isGuideImageSrc } from "./guideImages";
import { topLevelIndexToPos } from "./secretAnchors";
import {
  SECRETS_REFRESH_META,
  SecretsController,
  getSharedBinding,
} from "./secretsController";

export interface SecretBlocksOptions {
  // Read when the plugin runs, so the controller can arrive after the editor
  // (the companion loads separately) without recreating it. The controller
  // is attached to the editor by its owner.
  getController: () => SecretsController | null;
  // Images from secrets were dropped from a paste into the shared note.
  onGuideImagesRefused: () => void;
}

const secretBlocksKey = new PluginKey<DecorationSet>("secretBlocks");

function withoutGuideImages(fragment: Fragment): {
  fragment: Fragment;
  removed: boolean;
} {
  let removed = false;
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    if (node.type.name === "image" && isGuideImageSrc(node.attrs.src)) {
      removed = true;
      return;
    }
    const inner = withoutGuideImages(node.content);
    removed = removed || inner.removed;
    nodes.push(inner.removed ? node.copy(inner.fragment) : node);
  });
  return { fragment: removed ? Fragment.from(nodes) : fragment, removed };
}

// A Guide's shared editor, with each secret block of the companion document
// rendered as a widget between top-level nodes. Players' editors never get
// this extension, so nothing about secrets reaches them.
export const SecretBlocksExtension = Extension.create<SecretBlocksOptions>({
  name: "secretBlocks",

  // Ahead of Collaboration's Mod+Z, so undo follows the last change made in
  // the note or in a block.
  priority: 1100,

  addOptions() {
    return {
      getController: () => null,
      onGuideImagesRefused: () => {},
    };
  },

  addKeyboardShortcuts() {
    const controller = () => this.options.getController();
    return {
      "Mod-z": () => controller()?.undo.undo() ?? false,
      "Shift-Mod-z": () => controller()?.undo.redo() ?? false,
      "Mod-y": () => controller()?.undo.redo() ?? false,
      ArrowDown: () => controller()?.enterFromShared("down") ?? false,
      ArrowRight: () => controller()?.enterFromShared("right") ?? false,
      ArrowUp: () => controller()?.enterFromShared("up") ?? false,
      ArrowLeft: () => controller()?.enterFromShared("left") ?? false,
    };
  },

  onFocus() {
    this.options.getController()?.onSharedFocus();
  },

  addProseMirrorPlugins() {
    const { getController, onGuideImagesRefused } = this.options;

    // `bindingState` is a state whose sync plugin is set up. This plugin runs
    // ahead of it, so in a transaction that is the old state; the shared
    // document and fragment never change.
    const build = (state: EditorState, bindingState: EditorState) => {
      const controller = getController();
      const binding = getSharedBinding(bindingState);
      if (!controller || !binding) return DecorationSet.empty;
      const placed = controller.place(binding.doc, binding.fragment);
      return DecorationSet.create(
        state.doc,
        placed.flatMap((p, order) => {
          const block = controller.getBlock(p.id);
          if (!block) return [];
          return [
            Decoration.widget(
              topLevelIndexToPos(state.doc, p.index),
              () => block.dom,
              {
                key: p.id,
                // Keeps blocks at one boundary in reading order.
                side: order,
                stopEvent: () => true,
                ignoreSelection: true,
              },
            ),
          ];
        }),
      );
    };

    return [
      new Plugin<DecorationSet>({
        key: secretBlocksKey,
        state: {
          init: (_, state) => build(state, state),
          apply: (tr, old, oldState, state) =>
            tr.docChanged || tr.getMeta(SECRETS_REFRESH_META)
              ? build(state, oldState)
              : old.map(tr.mapping, tr.doc),
        },
        props: {
          decorations: (state) => secretBlocksKey.getState(state),
          // An image in a secret lives in the private bucket, which players
          // can't load, so it never comes along into the shared note.
          transformPasted: (slice: Slice) => {
            const { fragment, removed } = withoutGuideImages(slice.content);
            if (!removed) return slice;
            onGuideImagesRefused();
            if (fragment.size === 0) return Slice.empty;
            // Dropping a node can leave fewer levels to open.
            return Slice.maxOpen(fragment);
          },
        },
      }),
    ];
  },
});
