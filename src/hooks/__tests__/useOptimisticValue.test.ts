import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useOptimisticValue } from "../useOptimisticValue";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useOptimisticValue", () => {
  it("shows a change before the save comes back, then the saved value", async () => {
    const save = deferred();
    const { result, rerender } = renderHook(
      ({ saved }) => useOptimisticValue(saved, () => save.promise),
      { initialProps: { saved: "a" } },
    );

    act(() => result.current[1]?.("b"));
    expect(result.current[0]).toBe("b");

    await act(async () => save.resolve());
    expect(result.current[0]).toBe("b");

    rerender({ saved: "b" });
    expect(result.current[0]).toBe("b");
    rerender({ saved: "c" });
    expect(result.current[0]).toBe("c");
  });

  it("lets a change arriving from elsewhere win", () => {
    const { result, rerender } = renderHook(
      ({ saved }) => useOptimisticValue(saved, () => new Promise(() => {})),
      { initialProps: { saved: "a" } },
    );

    act(() => result.current[1]?.("b"));
    rerender({ saved: "c" });
    expect(result.current[0]).toBe("c");
  });

  it("goes back to the saved value when the save fails", async () => {
    const save = deferred();
    const { result } = renderHook(() =>
      useOptimisticValue("a", () => save.promise),
    );

    act(() => result.current[1]?.("b"));
    await act(async () => save.reject(new Error("offline")));
    expect(result.current[0]).toBe("a");
  });

  it("offers no change without a save", () => {
    const { result } = renderHook(() => useOptimisticValue("a", undefined));
    expect(result.current[1]).toBeUndefined();
  });
});
