import { act, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DieFace,
  DieFaceValue,
  nextDieFace,
  toDieFace,
  useDieFace,
} from "./DieFace";

/** The markup a die shows when it rests on `face`. */
function faceHtml(face: DieFaceValue) {
  return render(<DieFace face={face} />).container.innerHTML;
}

describe("DieFace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("reads only a whole 1 to 6 as a die face", () => {
    expect(toDieFace(4)).toBe(4);
    expect(toDieFace(0)).toBeUndefined();
    expect(toDieFace(7)).toBeUndefined();
    expect(toDieFace(2.5)).toBeUndefined();
    expect(toDieFace("3")).toBeUndefined();
    expect(toDieFace(undefined)).toBeUndefined();
  });

  it("cycles through other faces, then lands on the new one", () => {
    const { container, rerender } = render(<DieFace face={5} rolls={0} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden");
    rerender(<DieFace face={2} rolls={1} />);
    const between = container.innerHTML;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.innerHTML).toBe(faceHtml(2));
    expect(between).not.toBe(faceHtml(2));
  });

  it("cycles on a roll that lands on the face it showed", () => {
    const { container, rerender } = render(<DieFace face={3} rolls={0} />);
    rerender(<DieFace face={3} rolls={1} />);
    expect(container.innerHTML).not.toBe(faceHtml(3));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(container.innerHTML).toBe(faceHtml(3));
  });

  it("keeps cycling while the result is pending, then lands on it", () => {
    const { container, rerender } = render(<DieFace face={5} rolls={0} />);
    rerender(<DieFace face={5} rolls={1} pending />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.innerHTML).not.toBe(faceHtml(5));
    rerender(<DieFace face={1} rolls={1} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.innerHTML).toBe(faceHtml(1));
  });
});

describe("useDieFace", () => {
  it("lands on an action die and counts the roll", () => {
    const { result } = renderHook(() => useDieFace());
    act(() => result.current[1](2));
    expect(result.current[0]).toEqual({ face: 2, rolls: 1 });
    act(() => result.current[1](2));
    expect(result.current[0]).toEqual({ face: 2, rolls: 2 });
  });

  it("turns to a new face for a result that is not a d6", () => {
    const { result } = renderHook(() => useDieFace(4));
    act(() => result.current[1](87));
    expect(result.current[0].face).not.toBe(4);
    act(() => result.current[1]());
    expect(result.current[0].rolls).toBe(2);
  });

  it("waits for a promised result, and only the latest roll lands", async () => {
    const { result } = renderHook(() => useDieFace());
    let resolveFirst: (value: number) => void = () => {};
    let resolveSecond: (value: number) => void = () => {};
    act(() =>
      result.current[1](
        new Promise<number>((resolve) => (resolveFirst = resolve)),
      ),
    );
    expect(result.current[0]).toMatchObject({ face: 5, pending: true });
    act(() =>
      result.current[1](
        new Promise<number>((resolve) => (resolveSecond = resolve)),
      ),
    );
    await act(async () => resolveFirst(1));
    expect(result.current[0].pending).toBe(true);
    await act(async () => resolveSecond(6));
    expect(result.current[0]).toEqual({ face: 6, rolls: 2 });
  });
});
