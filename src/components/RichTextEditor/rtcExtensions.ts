import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import { Extensions, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { getHueFromString, hslToHex } from "lib/getHueFromString";

import { NoteMention } from "./NoteMention";
import { Alignment, TextWrapping } from "./RichImageNodeAttributes";
import { RichImageNodeView } from "./RichImageNodeView";
import { mentionSuggestionOptions } from "./otherNoteOptions";

const ExtendedImageExtension = Image.extend({
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

export const rtcExtensions = (params: {
  doc?: Y.Doc;
  provider?: WebrtcProvider;
  userId?: string;
  userName?: string;
}) => {
  const { doc, provider, userId, userName } = params;

  const userColor = userId
    ? hslToHex(getHueFromString(userId), 70, 80)
    : "#d0d0d0";

  const extensions: Extensions = [
    StarterKit.configure({
      history: false,
    }),
    ExtendedImageExtension,
    Mention.configure({
      suggestion: mentionSuggestionOptions,
    }).extend({
      addNodeView() {
        return ReactNodeViewRenderer(NoteMention);
      },
    }),
  ];
  if (doc && provider) {
    extensions.push(
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userName ?? "Unknown User",
          color: userColor,
        },
      }),
    );
  }

  return extensions;
};
