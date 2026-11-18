import { useEffect, useRef } from "react";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Drawer, DrawerBody, DrawerHeader } from "../../components/Drawer";
import { RollCard } from "../../game/RollCard";
import type { DockedRoll } from "./RollDock";

const listStyles = css({
  display: "grid",
  gap: "3",
  margin: 0,
  padding: 0,
  listStyle: "none",
  "& > li > *": { maxWidth: "none" },
});

const emptyStyles = css({
  margin: 0,
  paddingBlock: "6",
  color: "fg.muted",
  textAlign: "center",
});

export interface RecentRollsSheetProps {
  open: boolean;
  onClose: () => void;
  /** Oldest first, as the dock holds them; the sheet lists newest first. */
  rolls: DockedRoll[];
  onDismiss: (id: string) => void;
  /** Dismisses every roll and closes the sheet. */
  onClearAll: () => void;
  title?: string;
  clearAllLabel?: string;
  emptyLabel?: string;
  closeLabel?: string;
}

/**
 * Every recent roll, newest first, in a sheet from the bottom: each card
 * with its own Dismiss, and Clear all, which closes the sheet too. The roll
 * dock's "N rolls" handle opens it.
 */
export function RecentRollsSheet(props: RecentRollsSheetProps) {
  const {
    open,
    onClose,
    rolls,
    onDismiss,
    onClearAll,
    title = "Recent rolls",
    clearAllLabel = "Clear all",
    emptyLabel = "No recent rolls",
    closeLabel = "Close",
  } = props;
  const newestFirst = [...rolls].reverse();
  // When the last card is dismissed, focus moves to the message saying so
  // rather than being lost with the button.
  const emptyRef = useRef<HTMLParagraphElement>(null);
  const hadRolls = useRef(rolls.length > 0);
  useEffect(() => {
    if (open && hadRolls.current && rolls.length === 0) {
      emptyRef.current?.focus();
    }
    hadRolls.current = rolls.length > 0;
  }, [open, rolls.length]);
  return (
    <Drawer open={open} onClose={onClose} side="bottom" size="lg">
      <DrawerHeader
        title={title}
        closeLabel={closeLabel}
        actions={
          rolls.length > 0 && (
            <Button size="sm" variant="ghost" onClick={onClearAll}>
              {clearAllLabel}
            </Button>
          )
        }
      />
      <DrawerBody>
        {newestFirst.length === 0 ? (
          <p ref={emptyRef} className={emptyStyles} tabIndex={-1}>
            {emptyLabel}
          </p>
        ) : (
          <ul className={listStyles}>
            {newestFirst.map((item) => (
              <li key={item.id}>
                <RollCard
                  roll={item.roll}
                  onDismiss={() => onDismiss(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </DrawerBody>
    </Drawer>
  );
}
