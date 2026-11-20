import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NOW_TICK_MS, useNow } from "../useNow";

let clockRenders = 0;
let listRenders = 0;

function Clock(props: { label: string }) {
  clockRenders += 1;
  const now = useNow();
  return <span data-testid={props.label}>{now}</span>;
}

function List() {
  listRenders += 1;
  return (
    <>
      <Clock label="a" />
      <Clock label="b" />
    </>
  );
}

const start = new Date(2026, 10, 18, 20, 0).getTime();
const shown = (label: string) => Number(screen.getByTestId(label).textContent);

describe("useNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(start);
    clockRenders = 0;
    listRenders = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks every reader from one interval, re-rendering only the readers", () => {
    const { unmount } = render(<List />);
    expect(shown("a")).toBe(start);
    expect(vi.getTimerCount()).toBe(1);
    expect(listRenders).toBe(1);
    expect(clockRenders).toBe(2);

    act(() => vi.advanceTimersByTime(NOW_TICK_MS));
    expect(shown("a")).toBe(start + NOW_TICK_MS);
    expect(shown("b")).toBe(start + NOW_TICK_MS);
    expect(listRenders).toBe(1);
    expect(clockRenders).toBe(4);

    unmount();
  });

  it("stops while nothing reads it, and is current again for the next reader", () => {
    const first = render(<Clock label="a" />);
    first.unmount();
    expect(vi.getTimerCount()).toBe(0);

    vi.setSystemTime(start + 10 * 60_000);
    render(<Clock label="b" />);
    expect(shown("b")).toBe(start + 10 * 60_000);
    expect(vi.getTimerCount()).toBe(1);
  });
});
