import { Fragment, Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

import { isGuideImageSrc } from "./guideImages";

// Fired on the editor's element after a paste or drop brought images from a
// secret. Whoever owns the editor claims it with preventDefault, makes public
// copies, and calls `place` with their srcs (or none) to put them where the
// paste landed. Unclaimed, the images are left out.
export const GUIDE_IMAGES_PASTED_EVENT = "guide-images-pasted";

export interface GuideImagesPastedDetail {
  srcs: string[];
  place: (srcs: string[]) => void;
}

interface PendingImages {
  id: number;
  // Where the paste ended, mapped through every change since.
  pos: number;
  srcs: string[];
}

const pasteGuardKey = new PluginKey<PendingImages[]>("guideImagePasteGuard");

function withoutGuideImages(fragment: Fragment): {
  fragment: Fragment;
  removed: string[];
} {
  const removed: string[] = [];
  const nodes: ProseMirrorNode[] = [];
  let changed = false;
  fragment.forEach((node) => {
    if (node.type.name === "image" && isGuideImageSrc(node.attrs.src)) {
      removed.push(node.attrs.src);
      changed = true;
      return;
    }
    const inner = withoutGuideImages(node.content);
    removed.push(...inner.removed);
    if (inner.removed.length > 0) changed = true;
    nodes.push(inner.removed.length > 0 ? node.copy(inner.fragment) : node);
  });
  return { fragment: changed ? Fragment.from(nodes) : fragment, removed };
}

function placeImages(view: EditorView, id: number, srcs: string[]) {
  if (view.isDestroyed) return;
  const pending = pasteGuardKey
    .getState(view.state)
    ?.find((entry) => entry.id === id);
  if (!pending) return;
  const tr = view.state.tr.setMeta(pasteGuardKey, { remove: id });
  const image = view.state.schema.nodes.image;
  if (image && srcs.length > 0) {
    const nodes = srcs.map((src) => image.create({ src }));
    try {
      tr.replaceRange(
        pending.pos,
        pending.pos,
        new Slice(Fragment.from(nodes), 0, 0),
      );
    } catch (e) {
      console.error(e);
    }
  }
  view.dispatch(tr);
}

// An image in a secret lives in the private bucket, which players can't load,
// so its node never goes into text players read: a paste or drop leaves it
// out, and the editor's owner may put a public copy in its place. Every
// editor has this except a secret block's own, where such images belong.
export const GuideImagePasteGuard = Extension.create({
  name: "guideImagePasteGuard",

  addProseMirrorPlugins() {
    // Per editor: what the last transformed paste left out, until the paste
    // lands.
    let stripped: string[] | null = null;
    let nextId = 0;

    return [
      new Plugin<PendingImages[]>({
        key: pasteGuardKey,
        state: {
          init: () => [],
          apply(tr, pending) {
            let next = tr.docChanged
              ? pending.map((entry) => ({
                  ...entry,
                  pos: tr.mapping.map(entry.pos),
                }))
              : pending;
            const meta = tr.getMeta(pasteGuardKey) as
              | { remove: number }
              | undefined;
            if (meta) next = next.filter((entry) => entry.id !== meta.remove);
            const uiEvent = tr.getMeta("uiEvent");
            if (stripped && (uiEvent === "paste" || uiEvent === "drop")) {
              next = [
                ...next,
                { id: ++nextId, pos: tr.selection.to, srcs: stripped },
              ];
              stripped = null;
            }
            return next;
          },
        },
        view: () => {
          const announced = new Set<number>();
          return {
            update(view) {
              for (const entry of pasteGuardKey.getState(view.state) ?? []) {
                if (announced.has(entry.id)) continue;
                announced.add(entry.id);
                const event = new CustomEvent<GuideImagesPastedDetail>(
                  GUIDE_IMAGES_PASTED_EVENT,
                  {
                    cancelable: true,
                    detail: {
                      srcs: entry.srcs,
                      place: (srcs) => placeImages(view, entry.id, srcs),
                    },
                  },
                );
                if (view.dom.dispatchEvent(event)) {
                  // Nobody claimed them; don't dispatch from inside update.
                  queueMicrotask(() => placeImages(view, entry.id, []));
                }
              }
            },
          };
        },
        props: {
          transformPasted: (slice: Slice) => {
            const { fragment, removed } = withoutGuideImages(slice.content);
            stripped = removed.length > 0 ? removed : null;
            if (removed.length === 0) return slice;
            if (fragment.size === 0) return Slice.empty;
            // Dropping a node can leave fewer levels to open.
            return Slice.maxOpen(fragment);
          },
        },
      }),
    ];
  },
});
