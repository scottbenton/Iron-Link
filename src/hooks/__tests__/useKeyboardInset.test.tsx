import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  KEYBOARD_INSET_PROBE_CLASS,
  KEYBOARD_INSET_SETTLE_MS,
  subscribeKeyboardInset,
  useSettledKeyboardInset,
} from "../useKeyboardInset";

class FakeVisualViewport extends EventTarget {
  height = 844;
  offsetTop = 0;
}

let viewport: FakeVisualViewport;
// What the fixed probe measures: the box fixed elements are laid out
// against, which need not equal `innerHeight`.
let layoutHeight = 844;
const originalRect = HTMLElement.prototype.getBoundingClientRect;
const originalInnerHeight = window.innerHeight;

function probes() {
  return document.querySelectorAll(`.${KEYBOARD_INSET_PROBE_CLASS}`);
}

function setViewport(height: number, offsetTop = 0) {
  viewport.height = height;
  viewport.offsetTop = offsetTop;
}

function nextFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  viewport = new FakeVisualViewport();
  layoutHeight = 844;
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport,
  });
  HTMLElement.prototype.getBoundingClientRect = function boundingRect() {
    if (this.classList.contains(KEYBOARD_INSET_PROBE_CLASS)) {
      return { width: 0, height: layoutHeight } as DOMRect;
    }
    return originalRect.call(this);
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: originalInnerHeight,
  });
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: undefined,
  });
});

describe("subscribeKeyboardInset", () => {
  it("reports the current inset at once, then each change a frame later", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);
    expect(listener).toHaveBeenLastCalledWith(0);

    setViewport(508);
    viewport.dispatchEvent(new Event("resize"));
    expect(listener).toHaveBeenCalledTimes(1);
    nextFrame();
    expect(listener).toHaveBeenLastCalledWith(336);

    // iOS scrolling the layout viewport moves the visible area down.
    setViewport(508, 120);
    viewport.dispatchEvent(new Event("scroll"));
    nextFrame();
    expect(listener).toHaveBeenLastCalledWith(216);
    unsubscribe();
  });

  it("measures from the fixed probe, not innerHeight", () => {
    // Firefox on Android: the fixed box is taller than innerHeight reports
    // while its toolbar is retracting.
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 788,
    });
    layoutHeight = 844;
    setViewport(508);
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);
    expect(listener).toHaveBeenLastCalledWith(336);
    unsubscribe();
  });

  it("reads at most once per frame however many events arrive", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);
    const read = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");

    setViewport(700);
    viewport.dispatchEvent(new Event("resize"));
    setViewport(600);
    viewport.dispatchEvent(new Event("scroll"));
    setViewport(508);
    viewport.dispatchEvent(new Event("resize"));
    expect(read).not.toHaveBeenCalled();

    nextFrame();
    expect(read).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(336);
    unsubscribe();
  });

  it("re-reads on touchmove, which iOS momentum scrolling can fire alone", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);

    setViewport(508, 40);
    window.dispatchEvent(new Event("touchmove"));
    nextFrame();
    expect(listener).toHaveBeenLastCalledWith(296);
    unsubscribe();
  });

  it("shares one probe between subscribers and removes it after the last", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = subscribeKeyboardInset(first);
    const unsubscribeSecond = subscribeKeyboardInset(second);
    expect(probes()).toHaveLength(1);
    expect(probes()[0]).toHaveAttribute("aria-hidden", "true");

    setViewport(500);
    viewport.dispatchEvent(new Event("resize"));
    nextFrame();
    expect(first).toHaveBeenLastCalledWith(344);
    expect(second).toHaveBeenLastCalledWith(344);

    unsubscribeFirst();
    // Unsubscribing twice does not drop the other subscriber's count.
    unsubscribeFirst();
    expect(probes()).toHaveLength(1);

    unsubscribeSecond();
    expect(probes()).toHaveLength(0);

    // Detached: further events reach nobody and schedule nothing.
    setViewport(400);
    viewport.dispatchEvent(new Event("resize"));
    nextFrame();
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("drops a pending frame when the last subscriber leaves", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);
    setViewport(508);
    viewport.dispatchEvent(new Event("resize"));
    unsubscribe();
    nextFrame();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("is 0 with no probe without the visual viewport API", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
    const listener = vi.fn();
    const unsubscribe = subscribeKeyboardInset(listener);
    expect(listener).toHaveBeenLastCalledWith(0);
    expect(probes()).toHaveLength(0);
    unsubscribe();
  });
});

describe("useSettledKeyboardInset", () => {
  it("updates once the inset has held still, not per frame", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useSettledKeyboardInset();
    });
    const rendersAtRest = renders;

    // A keyboard opening over several frames.
    for (const height of [800, 700, 600, 508]) {
      setViewport(height);
      viewport.dispatchEvent(new Event("resize"));
      nextFrame();
    }
    expect(result.current).toBe(0);
    expect(renders).toBe(rendersAtRest);

    act(() => {
      vi.advanceTimersByTime(KEYBOARD_INSET_SETTLE_MS - 1);
    });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(336);
    expect(renders).toBe(rendersAtRest + 1);
  });

  it("restarts the wait while the inset keeps changing", () => {
    const { result } = renderHook(() => useSettledKeyboardInset());
    setViewport(600);
    viewport.dispatchEvent(new Event("resize"));
    nextFrame();
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_INSET_SETTLE_MS - 20);
    });
    setViewport(508);
    viewport.dispatchEvent(new Event("resize"));
    nextFrame();
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_INSET_SETTLE_MS - 20);
    });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current).toBe(336);
  });

  it("removes the probe on unmount", () => {
    const { unmount } = renderHook(() => useSettledKeyboardInset());
    expect(probes()).toHaveLength(1);
    unmount();
    expect(probes()).toHaveLength(0);
  });
});
