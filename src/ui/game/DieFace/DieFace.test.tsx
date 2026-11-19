import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DieFace, DieFaceValue, nextDieFace } from "./DieFace";

describe("DieFace", () => {
  it("never rolls the face already showing, and reaches every other", () => {
    for (let face = 1; face <= 6; face++) {
      const seen = new Set<number>();
      for (let i = 0; i < 300; i++) {
        seen.add(nextDieFace(face as DieFaceValue));
      }
      expect(seen.has(face)).toBe(false);
      expect(seen.size).toBe(5);
    }
  });

  it("keeps the old face while the new one fades in, then drops it", () => {
    const { container, rerender } = render(<DieFace face={5} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden");
    expect(root.children).toHaveLength(1);

    rerender(<DieFace face={2} />);
    expect(root.children).toHaveLength(2);
    fireEvent.animationEnd(root.children[0]);
    expect(root.children).toHaveLength(1);
  });
});
