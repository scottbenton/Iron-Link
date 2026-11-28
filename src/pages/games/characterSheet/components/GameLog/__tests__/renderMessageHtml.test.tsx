/**
 * Stored game log messages are HTML: they keep their formatting, and keep
 * nothing that could run script, style the page or add to its outline.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderMessageHtml } from "../renderMessageHtml";

function renderHtml(html: string) {
  return render(<div>{renderMessageHtml(html)}</div>).container.firstChild;
}

describe("renderMessageHtml", () => {
  it("keeps paragraphs, emphasis and lists", () => {
    expect(
      (
        renderHtml(
          "<p>A <strong>bold</strong> <em>plan</em></p><ul><li><p>One</p></li></ul>",
        ) as HTMLElement
      ).innerHTML,
    ).toBe(
      "<p>A <strong>bold</strong> <em>plan</em></p><ul><li><p>One</p></li></ul>",
    );
  });

  it("keeps only the text of anything else, and no attributes", () => {
    const root = renderHtml(
      '<p onclick="alert(1)" style="color:red">Hi</p><script>alert(1)</script><img src=x onerror="alert(1)"><iframe src="https://x.test"></iframe>',
    ) as HTMLElement;
    expect(root.innerHTML).toBe(
      "<p>Hi</p><span>alert(1)</span><span></span><span></span>",
    );
  });

  it("keeps web links, opening in a new tab, and drops other addresses", () => {
    const root = renderHtml(
      '<p><a href="https://example.test">Map</a> <a href="javascript:alert(1)">Trap</a></p>',
    ) as HTMLElement;
    const links = root.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://example.test");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(root).toHaveTextContent("Map Trap");
  });

  it("reads headings as bold paragraphs", () => {
    expect((renderHtml("<h2>Camp</h2>") as HTMLElement).innerHTML).toBe(
      "<p><strong>Camp</strong></p>",
    );
  });
});
