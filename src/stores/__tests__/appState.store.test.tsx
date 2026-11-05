import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAppState, useIsActiveRollCardHost } from "../appState.store";

describe("useIsActiveRollCardHost", () => {
  beforeEach(() => {
    useAppState.setState({ rollCardHosts: [] });
  });

  it("shows the roll cards in the newest dialog, then back on the page", () => {
    const page = renderHook(() => useIsActiveRollCardHost(true));
    expect(page.result.current).toBe(true);

    const dialog = renderHook(() => useIsActiveRollCardHost());
    page.rerender();
    expect(dialog.result.current).toBe(true);
    expect(page.result.current).toBe(false);

    dialog.unmount();
    page.rerender();
    expect(page.result.current).toBe(true);
  });

  it("keeps the page under a dialog that mounted before it", () => {
    const dialog = renderHook(() => useIsActiveRollCardHost());
    const page = renderHook(() => useIsActiveRollCardHost(true));
    dialog.rerender();
    expect(dialog.result.current).toBe(true);
    expect(page.result.current).toBe(false);
  });
});
