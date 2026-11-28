import { ReactNode, createElement } from "react";

// Stored messages are HTML. They are drawn from this short list of tags and
// nothing else: anything else keeps only its text, and no attribute but a
// safe link's address survives, so a message can never carry script or
// styles. Headings read as bold paragraphs, so a message can't add to the
// page's outline.
const ALLOWED_TAGS: Record<string, string> = {
  p: "p",
  br: "br",
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  s: "s",
  u: "u",
  code: "code",
  pre: "pre",
  blockquote: "blockquote",
  ul: "ul",
  ol: "ol",
  li: "li",
  hr: "hr",
};

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const VOID_TAGS = new Set(["br", "hr"]);
const SAFE_LINK = /^(https?:|mailto:)/i;

function renderNode(node: ChildNode, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const children = renderChildren(element);

  if (HEADING_TAGS.has(tag)) {
    return createElement("p", { key }, createElement("strong", null, children));
  }
  if (tag === "a") {
    const href = element.getAttribute("href")?.trim() ?? "";
    return SAFE_LINK.test(href)
      ? createElement(
          "a",
          { key, href, target: "_blank", rel: "noopener noreferrer" },
          children,
        )
      : createElement("span", { key }, children);
  }
  const allowed = ALLOWED_TAGS[tag];
  if (!allowed) return createElement("span", { key }, children);
  if (VOID_TAGS.has(allowed)) return createElement(allowed, { key });
  return createElement(allowed, { key }, children);
}

function renderChildren(parent: ParentNode): ReactNode[] {
  return Array.from(parent.childNodes).map(renderNode);
}

/** A stored game log message's HTML, as React nodes with only safe markup. */
export function renderMessageHtml(html: string): ReactNode[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  return renderChildren(document.body);
}
