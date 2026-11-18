import { useContext } from "react";

import { Confirm, ConfirmContext } from "./confirmContext";

/**
 * Asks a question in a ConfirmDialog and resolves `{ confirmed }` when it
 * closes, like material-ui-confirm's `useConfirm`. Needs a ConfirmProvider
 * (UIProvider mounts one).
 *
 * ```ts
 * const confirm = useConfirm();
 * const { confirmed } = await confirm({
 *   title: "Remove Asset",
 *   description: "Remove Ironclad from Kara? Its marked abilities are lost.",
 *   confirmationText: "Remove Asset",
 *   tone: "danger",
 * });
 * ```
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm needs a ConfirmProvider (UIProvider has one).");
  }
  return confirm;
}
