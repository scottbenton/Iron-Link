import { ToastCard } from "../../components/Toast";
import type { ToastCardProps } from "../../components/Toast";
import { RollCard } from "../RollCard";
import type { RollData } from "../RollCard";

/**
 * One card in the dock: a roll, or a notification (a toast's message, such
 * as "Progress marked"). They stack together, newest in front, as the
 * Toaster stacks them on wider screens.
 */
export type DockedItem =
  | { id: string; roll: RollData; toast?: undefined }
  | {
      id: string;
      toast: Omit<ToastCardProps, "onDismiss" | "className">;
      roll?: undefined;
    };

/** The card for a docked item, with its own named Dismiss. */
export function DockedCard(props: {
  item: DockedItem;
  onDismiss: () => void;
  /** In the dock: raised, sliding in. */
  docked?: boolean;
  className?: string;
}) {
  const { item, onDismiss, docked, className } = props;
  return item.roll ? (
    <RollCard
      roll={item.roll}
      elevated={docked}
      animateIn={docked}
      onDismiss={onDismiss}
      className={className}
    />
  ) : (
    <ToastCard {...item.toast} onDismiss={onDismiss} className={className} />
  );
}
