import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { Alignment, TextWrapping } from "./RichImageNodeAttributes";
import { RichImageNodeView } from "./RichImageNodeView";

export const ExtendedImageExtension = Image.extend({
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
      altText: {
        default: undefined,
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(RichImageNodeView);
  },
});
