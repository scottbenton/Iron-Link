import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { Alignment, TextWrapping } from "./RichImageNodeAttributes";
import { RichImageNodeView } from "./RichImageNodeView";

export const ExtendedImageExtension = Image.extend({
  draggable: false,
  addAttributes() {
    return {
      textWrapping: {
        default: TextWrapping.BreakText,
      },
      src: {
        default: undefined,
      },
      width: {
        default: null,
      },
      alignment: {
        default: Alignment.Left,
      },
      // Written as the image's alt in HTML (game log messages, copies), so
      // it is read there too. HTML from before kept it as "alttext".
      altText: {
        default: undefined,
        parseHTML: (element) =>
          element.getAttribute("alt") ??
          element.getAttribute("alttext") ??
          undefined,
        renderHTML: (attributes) =>
          attributes.altText ? { alt: attributes.altText } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(RichImageNodeView);
  },
});
