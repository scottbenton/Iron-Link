import { Fragment, Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Extension } from "@tiptap/react";

import { isGuideImageSrc } from "./guideImages";

// Fired on the editor's element when a paste lost images from a secret, so
// whoever owns the editor can say so.
export const GUIDE_IMAGES_REFUSED_EVENT = "guide-images-refused";

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

// An image in a secret lives in the private bucket, which players can't load,
// so a paste never brings one into text players read. Every editor has this
// except a secret block's own, where such images belong.
export const GuideImagePasteGuard = Extension.create({
  name: "guideImagePasteGuard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("guideImagePasteGuard"),
        props: {
          transformPasted: (slice: Slice, view) => {
            const { fragment, removed } = withoutGuideImages(slice.content);
            if (!removed) return slice;
            view.dom.dispatchEvent(new Event(GUIDE_IMAGES_REFUSED_EVENT));
            if (fragment.size === 0) return Slice.empty;
            // Dropping a node can leave fewer levels to open.
            return Slice.maxOpen(fragment);
          },
        },
      }),
    ];
  },
});
