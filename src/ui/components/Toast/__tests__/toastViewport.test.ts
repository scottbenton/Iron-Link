import { afterEach, describe, expect, it } from "vitest";

import { isPressOnToasts, toastViewportAttribute } from "../toastViewport";

function pressOn(target: EventTarget, reason = "outside-press") {
  const event = new Event("pointerdown");
  Object.defineProperty(event, "target", { value: target });
  return { reason, event };
}

describe("isPressOnToasts", () => {
  afterEach(() => document.body.replaceChildren());

  it("is true for an outside press inside the toast viewport", () => {
    const viewport = document.createElement("div");
    viewport.setAttribute(toastViewportAttribute, "");
    const button = document.createElement("button");
    viewport.append(button);
    document.body.append(viewport);
    expect(isPressOnToasts(pressOn(button))).toBe(true);
  });

  it("is false for presses elsewhere and for other reasons", () => {
    const viewport = document.createElement("div");
    viewport.setAttribute(toastViewportAttribute, "");
    const elsewhere = document.createElement("div");
    document.body.append(viewport, elsewhere);
    expect(isPressOnToasts(pressOn(elsewhere))).toBe(false);
    expect(isPressOnToasts(pressOn(viewport, "escape-key"))).toBe(false);
  });
});
