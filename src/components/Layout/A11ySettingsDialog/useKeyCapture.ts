import { useEffect, useState } from "react";

/**
 * Listens for the next key press for one action at a time. The press is
 * taken before anything else sees it, so Enter or a letter neither presses
 * a button nor types. Escape stops listening without setting a key (it no
 * longer becomes the shortcut, and closes nothing). Listening stops when
 * `active` turns false, such as when the dialog closes.
 */
export function useKeyCapture(
  active: boolean,
  onCapture: (actionKey: string, key: string) => void,
) {
  const [listeningFor, setListeningFor] = useState<string>();
  const listening = active ? listeningFor : undefined;

  useEffect(() => {
    if (!listening) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setListeningFor(undefined);
      if (event.key !== "Escape") {
        onCapture(listening, event.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [listening, onCapture]);

  useEffect(() => {
    if (!active) setListeningFor(undefined);
  }, [active]);

  return { listeningFor: listening, listenFor: setListeningFor };
}
