import { useEffect, useState } from "react";

import {
  VisibleArea,
  computeKeyboardInset,
  isSameVisibleArea,
} from "lib/keyboardInset";

// How long the inset must hold still before `useSettledKeyboardInset`
// reports it: past the gaps between a keyboard animation's frames, short
// enough that the caret's clearance lands as the keyboard does.
export const KEYBOARD_INSET_SETTLE_MS = 100;

// Class of the hidden probe the layout height is read from.
export const KEYBOARD_INSET_PROBE_CLASS = "keyboard-inset-probe";

type AreaListener = (area: VisibleArea) => void;

const NO_KEYBOARD: VisibleArea = { inset: 0, offsetLeft: 0, scale: 1 };

const listeners = new Set<AreaListener>();
let area = NO_KEYBOARD;
let probe: HTMLElement | null = null;
let frame: number | null = null;

// A fixed box filling the viewport fixed elements are laid out against. Its
// height is the layout height the keyboard inset is measured from, which
// `innerHeight` is not everywhere: Firefox on Android reports the window
// without its dynamic toolbar while fixed elements still sit above it, which
// leaves a bar floating a toolbar's height over the keyboard.
function createProbe(): HTMLElement {
  const element = document.createElement("div");
  element.className = KEYBOARD_INSET_PROBE_CLASS;
  element.setAttribute("aria-hidden", "true");
  element.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100%;visibility:hidden;pointer-events:none;";
  return element;
}

function readArea(): VisibleArea {
  const viewport = window.visualViewport;
  if (!viewport || !probe) return NO_KEYBOARD;
  return {
    inset: computeKeyboardInset({
      layoutHeight: probe.getBoundingClientRect().height,
      visualHeight: viewport.height,
      visualOffsetTop: viewport.offsetTop,
    }),
    offsetLeft: viewport.offsetLeft,
    scale: viewport.scale,
  };
}

function update() {
  frame = null;
  const next = readArea();
  if (isSameVisibleArea(next, area)) return;
  area = next;
  for (const listener of [...listeners]) listener(next);
}

// Every event within one frame costs one read: a keyboard animation fires
// several, and each read forces layout.
function scheduleUpdate() {
  if (frame !== null) return;
  frame = requestAnimationFrame(update);
}

function attach() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  probe = createProbe();
  document.body.appendChild(probe);
  viewport.addEventListener("resize", scheduleUpdate);
  viewport.addEventListener("scroll", scheduleUpdate);
  // iOS momentum scrolling does not always fire the visual viewport's scroll.
  window.addEventListener("touchmove", scheduleUpdate, { passive: true });
  area = readArea();
}

function detach() {
  const viewport = window.visualViewport;
  if (viewport) {
    viewport.removeEventListener("resize", scheduleUpdate);
    viewport.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("touchmove", scheduleUpdate);
  }
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  probe?.remove();
  probe = null;
  area = NO_KEYBOARD;
}

// Calls `listener` with the visible area (the on-screen keyboard's height in
// CSS pixels, 0 with none, and the pinch zoom and pan) at once, then at most
// once per frame while it changes. For code that writes to the DOM directly
// to follow the keyboard frame by frame without a React render; anything that
// renders reads `useSettledKeyboardInset`.
//
// One shared set of listeners and one probe however many subscribe: the first
// subscriber attaches them and the last removes them. Without the visual
// viewport API (jsdom, very old browsers) the inset is always 0.
export function subscribeVisibleArea(listener: AreaListener): () => void {
  // Wrapped, so the same function subscribed twice is two subscriptions.
  const entry: AreaListener = (value) => listener(value);
  listeners.add(entry);
  if (listeners.size === 1) attach();
  listener(area);
  return () => {
    if (!listeners.delete(entry)) return;
    if (listeners.size === 0) detach();
  };
}

// The keyboard inset once it has held still for `KEYBOARD_INSET_SETTLE_MS`:
// one update per keyboard open or close rather than one per frame of its
// motion, so React and the editor do their work once. The first reading
// applies at once.
export function useSettledKeyboardInset(): number {
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let first = true;
    let last = 0;
    const unsubscribe = subscribeVisibleArea(({ inset: value }) => {
      // Panning a zoomed page moves the area without changing the inset.
      if (!first && value === last) return;
      last = value;
      if (first) {
        first = false;
        setSettled(value);
        return;
      }
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        setSettled(value);
      }, KEYBOARD_INSET_SETTLE_MS);
    });
    return () => {
      if (timer !== null) clearTimeout(timer);
      unsubscribe();
    };
  }, []);
  return settled;
}
