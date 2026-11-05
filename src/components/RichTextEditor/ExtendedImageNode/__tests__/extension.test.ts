import { generateHTML, generateJSON } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { ExtendedImageExtension } from "../extension";

const extensions = [StarterKit, ExtendedImageExtension];

describe("ExtendedImageExtension alt text", () => {
  it("writes alt text as the image's alt", () => {
    const html = generateHTML(
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/a.png", altText: "A map" },
          },
        ],
      },
      extensions,
    );
    expect(html).toContain('alt="A map"');
  });

  it("reads alt text from alt, and from the older alttext attribute", () => {
    const read = (html: string) =>
      generateJSON(html, extensions).content?.find(
        (node: { type: string }) => node.type === "image",
      )?.attrs?.altText;

    expect(read('<img src="a.png" alt="A map">')).toBe("A map");
    expect(read('<img src="a.png" alttext="Old map">')).toBe("Old map");
  });
});
