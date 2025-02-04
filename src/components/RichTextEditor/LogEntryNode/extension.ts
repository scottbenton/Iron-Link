import { Node, ReactNodeViewRenderer, nodePasteRule } from "@tiptap/react";

import { LogEntryNode } from "./LogEntryNode";

const logEntryRegex = new RegExp(/iron-link-logid:(?<logId>[\S]+)/g);

export const LogEntryNodeExtension = Node.create({
  name: "logEntryNode",

  isolating: true,
  group: "block",
  inline: false,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      logId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-log-id]",
        getAttrs: (dom) => {
          const logId = dom.getAttribute("data-log-id");
          return { logId };
        },
      },
    ];
  },
  renderHTML({ node }) {
    return ["span", { "data-log-id": node.attrs.logId }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LogEntryNode);
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: logEntryRegex,
        type: this.type,
        getAttributes: (match) => {
          const logId = match[1];
          return { logId: logId };
        },
      }),
    ];
  },
});
