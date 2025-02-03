import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { getHueFromString, hslToHex } from "lib/getHueFromString";

import { ExtendedImageExtension } from "./ExtendedImageNode";
import { LogEntryNodeExtension } from "./LogEntryNode";
import { NoteMentionExtension } from "./NoteMentionExtension";

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
    NoteMentionExtension,
    LogEntryNodeExtension,
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
