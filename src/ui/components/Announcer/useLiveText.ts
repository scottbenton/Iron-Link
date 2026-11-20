import { useEffect, useRef, useState } from "react";

// How long a live region stays empty between two messages. Screen readers
// only read a live region when its text changes, so a message that repeats
// the last one is cleared and written again after this pause.
const CLEAR_DELAY_MS = 100;

export interface LiveMessage {
  text: string;
  /** Goes up with every message, so a repeat is still read. */
  nonce: number;
}

/**
 * The text a live region should hold. It starts empty, so a region mounted
 * after a message (a dialog opening) does not read that message again, and
 * it is cleared and rewritten for every new message, repeats included.
 * Ported from Iron Link's `useLiveRegionText`.
 */
export function useLiveText(message: LiveMessage | null) {
  const [text, setText] = useState("");
  const mountedNonce = useRef(message?.nonce);
  useEffect(() => {
    if (!message || message.nonce === mountedNonce.current) return;
    setText("");
    const timeout = setTimeout(() => setText(message.text), CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [message]);
  return text;
}
