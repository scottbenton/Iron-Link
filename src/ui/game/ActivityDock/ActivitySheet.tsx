import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Drawer, DrawerBody, DrawerHeader } from "../../components/Drawer";
import { DockedCard } from "./DockedCard";
import type { DockedItem } from "./DockedCard";

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

export interface ActivitySheetProps {
  open: boolean;
  onClose: () => void;
  /** Oldest first, as the dock holds them; the sheet lists newest first. */
  items: DockedItem[];
  onDismiss: (id: string) => void;
  /** Dismisses every item and closes the sheet. */
  onClearAll: () => void;
  title?: string;
  clearAllLabel?: string;
  emptyLabel?: string;
  closeLabel?: string;
}

/**
 * Every recent roll and notification, newest first, in a sheet from the
 * bottom: each card with its own Dismiss, and Clear all, which closes the
 * sheet too. The activity dock's "N notifications" handle opens it.
 */
export function ActivitySheet(props: ActivitySheetProps) {
  const { t } = useTranslation();
  const {
    open,
    onClose,
    items,
    onDismiss,
    onClearAll,
    title = t("ui.activity-dock.notifications", "Notifications"),
    clearAllLabel = t("ui.activity-dock.clear-all", "Clear all"),
    emptyLabel = t("ui.activity-dock.empty", "No notifications"),
    closeLabel = t("ui.common.close", "Close"),
  } = props;
  const newestFirst = [...items].reverse();
  // When the last card is dismissed, focus moves to the message saying so
  // rather than being lost with the button.
  const emptyRef = useRef<HTMLParagraphElement>(null);
  const hadItems = useRef(items.length > 0);
  useEffect(() => {
    if (open && hadItems.current && items.length === 0) {
      emptyRef.current?.focus();
    }
    hadItems.current = items.length > 0;
  }, [open, items.length]);
  return (
    <Drawer open={open} onClose={onClose} side="bottom" size="lg">
      <DrawerHeader
        title={title}
        closeLabel={closeLabel}
        actions={
          items.length > 0 && (
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
                <DockedCard item={item} onDismiss={() => onDismiss(item.id)} />
              </li>
            ))}
          </ul>
        )}
      </DrawerBody>
    </Drawer>
  );
}
