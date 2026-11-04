import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ScrollFadeRow } from "../ScrollFadeRow";

// jsdom lays nothing out, so every element reports these.
let layout = { scrollLeft: 0, scrollWidth: 300, clientWidth: 300 };
const keys = ["scrollLeft", "scrollWidth", "clientWidth"] as const;

beforeEach(() => {
  layout = { scrollLeft: 0, scrollWidth: 300, clientWidth: 300 };
  keys.forEach((key) =>
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => layout[key],
    }),
  );
});

// Dropping the stubs uncovers jsdom's own, on Element.
afterEach(() => {
  keys.forEach((key) => Reflect.deleteProperty(HTMLElement.prototype, key));
});

function renderRow() {
  const { container } = render(
    <ScrollFadeRow>
      <button type="button">Bold</button>
    </ScrollFadeRow>,
  );
  const scroller = container.firstElementChild as HTMLElement;
  return {
    scroller,
    scrollTo(scrollLeft: number) {
      layout.scrollLeft = scrollLeft;
      fireEvent.scroll(scroller);
    },
    mask: () => getComputedStyle(scroller).getPropertyValue("mask-image"),
  };
}

describe("ScrollFadeRow", () => {
  it("doesn't fade a row that fits", () => {
    expect(renderRow().mask()).toBe("none");
  });

  it("fades only the edges with more of the row beyond them", () => {
    layout.scrollWidth = 500;
    const { scrollTo, mask } = renderRow();
    expect(mask()).toBe(
      "linear-gradient(to right, #000, #000 calc(100% - 24px), transparent)",
    );

    scrollTo(100);
    expect(mask()).toBe(
      "linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
    );

    scrollTo(200);
    expect(mask()).toBe(
      "linear-gradient(to right, transparent, #000 24px, #000)",
    );
  });

  it("treats a fractional scroll at an edge as at it", () => {
    layout.scrollWidth = 500;
    const { scrollTo, mask } = renderRow();
    scrollTo(199.5);
    expect(mask()).toBe(
      "linear-gradient(to right, transparent, #000 24px, #000)",
    );
  });
});
