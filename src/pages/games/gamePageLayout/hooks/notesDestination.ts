import type { MouseEvent } from "react";

import type { WorldLinkProps } from "components/worlds/worldNavigation";

import type { IOpenNoteItem } from "stores/notes.store";

const queryKeys = [
  "note-type",
  "note-id",
  "note-world-view",
  "note-category-id",
];

// The raw destination query values, so callers can tell when the URL itself
// changed, including to an invalid destination.
export function getNotesDestinationQuery(params: URLSearchParams): string {
  return queryKeys.map((key) => params.get(key) ?? "").join("\u0000");
}

export function readNotesDestination(
  params: URLSearchParams,
): IOpenNoteItem | undefined {
  const type = params.get("note-type");
  const itemId = params.get("note-id");
  if (!itemId || !["note", "folder", "world"].includes(type ?? ""))
    return undefined;
  if (type !== "world") return { type: type as "note" | "folder", itemId };
  const view = params.get("note-world-view") ?? "world";
  if (view === "world" || view === "settings")
    return { type, itemId, worldView: { type: view } };
  const categoryId = params.get("note-category-id");
  if ((view === "category" || view === "category-settings") && categoryId) {
    return { type, itemId, worldView: { type: view, categoryId } };
  }
  return undefined;
}

export function writeNotesDestination(
  params: URLSearchParams,
  item?: IOpenNoteItem | null,
): URLSearchParams {
  const next = new URLSearchParams(params);
  queryKeys.forEach((key) => next.delete(key));
  if (item) {
    next.set("note-type", item.type);
    next.set("note-id", item.itemId);
    if (item.type === "world") {
      const view = item.worldView ?? { type: "world" };
      if (view.type !== "world") next.set("note-world-view", view.type);
      if ("categoryId" in view) next.set("note-category-id", view.categoryId);
    }
  }
  return next;
}

export function notesDestinationKey(item?: IOpenNoteItem | null): string {
  return writeNotesDestination(new URLSearchParams(), item).toString();
}

export function getNotesItemLinkProps(
  pathname: string,
  params: URLSearchParams,
  item: IOpenNoteItem,
  openItem: (item: IOpenNoteItem, background: boolean) => void,
): WorldLinkProps {
  const search = writeNotesDestination(params, item).toString();
  const open = (event: MouseEvent<HTMLElement>, background: boolean) => {
    event.preventDefault();
    openItem(item, background);
  };
  return {
    href: `${pathname}${search ? `?${search}` : ""}`,
    onClick: (event) => open(event, event.ctrlKey || event.metaKey),
    onAuxClick: (event) => {
      if (event.button === 1) open(event, true);
    },
    onMouseDown: (event) => {
      if (event.button === 1) event.preventDefault();
    },
  };
}
