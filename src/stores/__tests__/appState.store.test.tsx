import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ReferenceTabs,
  useAppState,
  useIsActiveRollCardHost,
} from "../appState.store";

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

describe("game log notifications", () => {
  beforeEach(() => {
    useAppState.setState({
      currentReferenceTab: ReferenceTabs.Moves,
      isReferencePanelVisible: true,
      gameLogNotificationCount: 0,
    });
  });

  it("counts unread entries while the log is not showing", () => {
    useAppState.getState().setGameLogNotificationCount(3);
    expect(useAppState.getState().gameLogNotificationCount).toBe(3);
  });

  it("clears the count when the log tab opens", () => {
    useAppState.getState().setGameLogNotificationCount(3);
    useAppState.getState().setCurrentReferenceTab(ReferenceTabs.GameLog);
    expect(useAppState.getState().gameLogNotificationCount).toBe(0);
  });

  it("keeps counting while the log tab is chosen but its panel is hidden", () => {
    const state = useAppState.getState();
    state.setCurrentReferenceTab(ReferenceTabs.GameLog);
    state.setIsReferencePanelVisible(false);
    state.setGameLogNotificationCount(2);
    expect(useAppState.getState().gameLogNotificationCount).toBe(2);
  });

  it("clears the count when the panel shows the log again", () => {
    const state = useAppState.getState();
    state.setCurrentReferenceTab(ReferenceTabs.GameLog);
    state.setIsReferencePanelVisible(false);
    state.setGameLogNotificationCount(2);
    state.setIsReferencePanelVisible(true);
    expect(useAppState.getState().gameLogNotificationCount).toBe(0);
  });

  it("reads the log as read while it is showing", () => {
    useAppState.getState().setCurrentReferenceTab(ReferenceTabs.GameLog);
    useAppState.getState().setGameLogNotificationCount(4);
    expect(useAppState.getState().gameLogNotificationCount).toBe(0);
  });
});
