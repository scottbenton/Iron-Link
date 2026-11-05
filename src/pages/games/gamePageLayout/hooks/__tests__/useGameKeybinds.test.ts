import { afterEach, describe, expect, it } from "vitest";

import { focusFirstElement } from "../useGameKeybinds";

describe("focusFirstElement", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the first id in the page", () => {
    document.body.innerHTML = `
      <button id="second">Second</button>
    `;
    expect(focusFirstElement(["first", "second"])).toBe(true);
    expect(document.activeElement?.id).toBe("second");
  });

  it("skips elements inside a hidden panel", () => {
    document.body.innerHTML = `
      <div hidden><h2 id="first" tabindex="-1">First</h2></div>
      <button id="second">Second</button>
    `;
    focusFirstElement(["first", "second"]);
    expect(document.activeElement?.id).toBe("second");
  });

  it("does nothing when none of the ids is there", () => {
    expect(focusFirstElement(["missing"])).toBe(false);
  });
});
