import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveRegion } from "../LiveRegion";

describe("LiveRegion", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not read a message that was there before it mounted", () => {
    render(<LiveRegion message="Strong hit" nonce={3} />);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("clears, then writes a repeated message again", () => {
    const { rerender } = render(<LiveRegion message="Strong hit" nonce={1} />);
    rerender(<LiveRegion message="Strong hit" nonce={2} />);
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Strong hit");

    rerender(<LiveRegion message="Strong hit" nonce={3} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Strong hit");
  });
});
