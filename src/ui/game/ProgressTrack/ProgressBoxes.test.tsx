import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressBoxes } from "./ProgressBoxes";

function lines(container: HTMLElement) {
  return Array.from(container.querySelectorAll("line"));
}

describe("ProgressBoxes", () => {
  it("draws every tick at once but the newest under rapid changes", () => {
    const { container, rerender } = render(<ProgressBoxes ticks={4} />);
    rerender(<ProgressBoxes ticks={5} />);
    rerender(<ProgressBoxes ticks={6} />);

    const all = lines(container);
    const on = all.filter((line) => line.hasAttribute("data-on"));
    const drawing = all.filter((line) => line.hasAttribute("data-drawing"));
    expect(on).toHaveLength(6);
    expect(drawing).toEqual([all[5]]);
  });
});
