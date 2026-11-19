import { fireEvent, render } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

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
    const { container, rerender } = render(<DieFace face={5} motion="fade" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden");
    expect(root.children).toHaveLength(1);

    rerender(<DieFace face={2} motion="fade" />);
    expect(root.children).toHaveLength(2);
    fireEvent.animationEnd(root.children[0]);
    expect(root.children).toHaveLength(1);
  });

  it("replaces the face without keeping the old one in other motions", () => {
    const { container, rerender } = render(<DieFace face={5} motion="tilt" />);
    const root = container.firstElementChild as HTMLElement;
    rerender(<DieFace face={2} motion="tilt" />);
    expect(root.children).toHaveLength(1);
  });

  it("cycles through other faces, then lands on the new one", () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(
        <DieFace face={5} motion="cycle" />,
      );
      const svgHtml = () => container.innerHTML;
      rerender(<DieFace face={2} motion="cycle" />);
      const between = svgHtml();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      const landed = svgHtml();
      const { container: two } = render(<DieFace face={2} motion="swap" />);
      expect(landed).toBe(two.innerHTML);
      // An in-between face is never the one it lands on.
      expect(between).not.toBe(landed);
    } finally {
      vi.useRealTimers();
    }
  });
});
