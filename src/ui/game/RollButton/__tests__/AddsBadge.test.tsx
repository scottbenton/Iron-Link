import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddsBadge } from "../AddsBadge";

function badgeOf(container: HTMLElement) {
  const badge = container.querySelector<HTMLElement>("[data-adds]");
  if (!badge) throw new Error("no badge");
  return badge;
}

const originalAnimate = HTMLElement.prototype.animate;

describe("AddsBadge", () => {
  afterEach(() => {
    HTMLElement.prototype.animate = originalAnimate;
    document.documentElement.removeAttribute("data-motion");
  });

  it("stays mounted but hidden at 0", () => {
    const { container } = render(<AddsBadge value={0} />);
    const badge = badgeOf(container);
    expect(badge).toHaveAttribute("data-hidden");
    expect(badge).toHaveTextContent("");
  });

  it("keeps its last value while it clears, so it fades out with it", () => {
    const { container, rerender } = render(<AddsBadge value={2} />);
    expect(badgeOf(container)).not.toHaveAttribute("data-hidden");
    expect(badgeOf(container)).toHaveTextContent("+2");
    rerender(<AddsBadge value={0} />);
    expect(badgeOf(container)).toHaveAttribute("data-hidden");
    expect(badgeOf(container)).toHaveTextContent("+2");
    rerender(<AddsBadge value={-1} />);
    expect(badgeOf(container)).not.toHaveAttribute("data-hidden");
    expect(badgeOf(container)).toHaveTextContent("−1");
  });

  it("bumps only when a set value changes, and not under reduced motion", () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    HTMLElement.prototype.animate =
      animate as unknown as HTMLElement["animate"];
    const { rerender } = render(<AddsBadge value={0} />);
    rerender(<AddsBadge value={1} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<AddsBadge value={2} />);
    // The pill's bump and the number's fade.
    expect(animate).toHaveBeenCalledTimes(2);
    rerender(<AddsBadge value={0} />);
    expect(animate).toHaveBeenCalledTimes(2);

    document.documentElement.setAttribute("data-motion", "reduced");
    rerender(<AddsBadge value={3} />);
    rerender(<AddsBadge value={4} />);
    expect(animate).toHaveBeenCalledTimes(2);
  });
});
