import { IGameLogRoll } from "services/gameLog.service";

import { convertRollToClipboard } from "./clipboardFormatter";

async function pasteRich(rich: string, plain: string) {
  if (typeof ClipboardItem !== "undefined") {
    // Shiny new Clipboard API, not fully supported in Firefox.
    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility
    const html = new Blob([rich], { type: "text/html" });
    const text = new Blob([plain], { type: "text/plain" });
    const data = new ClipboardItem({ "text/html": html, "text/plain": text });
    await navigator.clipboard.write([data]);
  } else {
    // Fallback using the deprecated `document.execCommand`.
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
    const cb = (e: ClipboardEvent) => {
      e.clipboardData?.setData("text/html", rich);
      e.clipboardData?.setData("text/plain", plain);
      e.preventDefault();
    };
    document.addEventListener("copy", cb);
    document.execCommand("copy");
    document.removeEventListener("copy", cb);
  }
}

/**
 * Copies a roll as rich text (and plain text beside it). Resolves to
 * `unsupported` for a roll type with no clipboard form; rejects if the
 * browser refuses.
 */
export async function copyRollToClipboard(
  roll: IGameLogRoll,
): Promise<"copied" | "unsupported"> {
  const data = convertRollToClipboard(roll);
  if (!data) return "unsupported";
  await pasteRich(data.rich, data.plain);
  return "copied";
}
