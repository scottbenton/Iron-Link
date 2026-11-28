// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssetControl } from "ui/game/AssetCard";

import {
  CLOCK_SAVE_DELAY_MS,
  useDebouncedClockChanges,
} from "../useDebouncedClockChanges";

const controls = {
  clock: { field_type: "clock" },
  health: { field_type: "condition_meter" },
} as unknown as Record<string, AssetControl>;

describe("useDebouncedClockChanges", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves a meter at once", () => {
    const save = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedClockChanges({ controlValues: {} }, controls, save),
    );
    act(() => result.current.onControlChange?.("health", 3));
    expect(save).toHaveBeenCalledWith("health", 3);
  });

  it("shows clock clicks at once and saves the last after the delay", () => {
    const save = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedClockChanges({ controlValues: { clock: 0 } }, controls, save),
    );
    act(() => result.current.onControlChange?.("clock", 1));
    act(() => result.current.onControlChange?.("clock", 2));
    expect(result.current.state?.controlValues?.clock).toBe(2);
    expect(save).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(CLOCK_SAVE_DELAY_MS));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("clock", 2);
  });

  it("saves a held clock when the card goes away", () => {
    const save = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedClockChanges({ controlValues: {} }, controls, save),
    );
    act(() => result.current.onControlChange?.("clock", 3));
    unmount();
    expect(save).toHaveBeenCalledWith("clock", 3);
  });

  it("offers no handler to a reader who can't edit", () => {
    const { result } = renderHook(() =>
      useDebouncedClockChanges({ controlValues: {} }, controls, undefined),
    );
    expect(result.current.onControlChange).toBeUndefined();
  });
});
