import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";

import {
  SEARCH_RESULTS_ANNOUNCE_DELAY_MS,
  useAnnounceSearchResults,
} from "../useAnnounceSearchResults";

describe("useAnnounceSearchResults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppState.setState({ announcement: null, announcementId: 0 });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the result count once typing settles", () => {
    const { rerender } = renderHook(
      ({ search, message }) => useAnnounceSearchResults(search, message),
      { initialProps: { search: "fa", message: "4 moves found" } },
    );
    act(() => vi.advanceTimersByTime(SEARCH_RESULTS_ANNOUNCE_DELAY_MS / 2));
    rerender({ search: "fac", message: "1 move found" });
    act(() => vi.advanceTimersByTime(SEARCH_RESULTS_ANNOUNCE_DELAY_MS / 2));
    expect(useAppState.getState().announcement).toBeNull();

    act(() => vi.advanceTimersByTime(SEARCH_RESULTS_ANNOUNCE_DELAY_MS));
    expect(useAppState.getState().announcement).toBe("1 move found");
    expect(useAppState.getState().announcementId).toBe(1);
  });

  it("reads nothing while the filter is empty", () => {
    renderHook(() => useAnnounceSearchResults("  ", "200 moves found"));
    act(() => vi.advanceTimersByTime(SEARCH_RESULTS_ANNOUNCE_DELAY_MS * 2));
    expect(useAppState.getState().announcement).toBeNull();
  });
});
