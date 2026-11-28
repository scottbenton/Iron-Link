import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "i18n/config";

// jsdom has no scrollBy, which tab strips use to keep the current tab in view.
if (typeof Element !== "undefined") Element.prototype.scrollBy ??= () => {};
// jsdom has no PointerEvent, which Base UI's radios and checkboxes dispatch.
if (typeof MouseEvent !== "undefined")
  globalThis.PointerEvent ??= class extends MouseEvent {} as never;

afterEach(() => {
  cleanup();
});
