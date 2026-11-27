import { useUIThemeBridge } from "./useUIThemeBridge";

/** Renders nothing; puts the app's theme where the UI library reads it. */
export function UIThemeBridge() {
  useUIThemeBridge();
  return null;
}
