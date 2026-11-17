import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ROLL_DOCK_HEIGHT_PROPERTY,
  usePublishRollDockHeight,
} from "../usePublishRollDockHeight";

let observerCallback: (() => void) | null = null;
const disconnect = vi.fn();

class MockResizeObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    disconnect();
  }
}

function makeElement(height: number) {
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ height }) as DOMRect;
  return element;
}

function readHeight() {
  return document.documentElement.style.getPropertyValue(
    ROLL_DOCK_HEIGHT_PROPERTY,
  );
}

describe("usePublishRollDockHeight", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    document.documentElement.style.removeProperty(ROLL_DOCK_HEIGHT_PROPERTY);
    observerCallback = null;
    disconnect.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("publishes the dock's height and follows it as it changes", () => {
    let height = 120.4;
    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({ height }) as DOMRect;

    renderHook(() => usePublishRollDockHeight(element, true));
    expect(readHeight()).toBe("121px");

    height = 0;
    observerCallback?.();
    expect(readHeight()).toBe("0px");
  });

  it("publishes nothing while another place shows the rolls", () => {
    renderHook(() => usePublishRollDockHeight(makeElement(80), false));
    expect(readHeight()).toBe("");
    expect(observerCallback).toBe(null);
  });

  it("goes back to 0 when it stops publishing", () => {
    const element = makeElement(80);
    const { rerender, unmount } = renderHook(
      ({ isPublishing }) => usePublishRollDockHeight(element, isPublishing),
      { initialProps: { isPublishing: true } },
    );
    expect(readHeight()).toBe("80px");

    rerender({ isPublishing: false });
    expect(readHeight()).toBe("0px");
    expect(disconnect).toHaveBeenCalledTimes(1);

    rerender({ isPublishing: true });
    expect(readHeight()).toBe("80px");
    unmount();
    expect(readHeight()).toBe("0px");
  });
});
