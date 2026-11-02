import { useMemo, useState } from "react";

import { useUID } from "stores/auth.store";
import { useWorldIsGuided, useWorldPermission } from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import { useWorldMapsStore } from "stores/worldMaps.store";

import { isValidWorldEntryParent } from "lib/worldEntryParents";
import { snapToGrid } from "lib/worldMap/content";
import { Point, WorldMapGrid } from "lib/worldMap/grid";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldMapPin } from "services/worldMaps.service";

import { getLinkedWorldEntryPermissions } from "../entries/worldEntryPermissions";
import { WorldMapNewPlaceDialog } from "./WorldMapNewPlaceDialog";
import { WorldMapPointerEvent } from "./WorldMapViewport";
import { useWorldMapLocationTypes } from "./useWorldMapLocationTypes";
import { WorldMapPinTarget } from "./worldMapTools";

// Where a place that could be pinned is now: on this map, inside this entry
// but not on the map, or elsewhere in the world (pinning moves it in here).
export type WorldMapPlaceWhere = "pinned" | "inside" | "elsewhere";

export interface WorldMapPlaceOption {
  entry: IWorldEntry;
  where: WorldMapPlaceWhere;
  // The entry it sits in now, for places elsewhere.
  parentName?: string;
}

// The pin tool: putting places on an entry's map, moving them and taking them
// off. A tap puts down the chosen place (moving it if it was already pinned,
// and moving it inside this entry if it was elsewhere) or opens the new place
// dialog; new places go inside this entry with the chosen Location Type and
// sharing to match it.
export function useWorldMapPins(
  entry: IWorldEntry,
  grid: WorldMapGrid,
  pins: Record<string, IWorldMapPin>,
  onError: (cause: unknown) => void,
) {
  const uid = useUID();
  const permission = useWorldPermission();
  const guided = useWorldIsGuided();
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const createEntry = useWorldEntriesStore((store) => store.createEntry);
  const setFieldValue = useWorldEntriesStore((store) => store.setFieldValue);
  const setEntryParent = useWorldEntriesStore((store) => store.setEntryParent);
  const entryPermissions = useWorldEntriesStore(
    (store) => store.entryState.permissions,
  );
  const setPin = useWorldMapsStore((store) => store.setPin);
  const removePin = useWorldMapsStore((store) => store.removePin);
  const { fieldId, types } = useWorldMapLocationTypes(entry.categoryId);
  const [target, setTarget] = useState<WorldMapPinTarget>({
    type: "new",
    locationType: null,
  });
  const [newPlaceAt, setNewPlaceAt] = useState<Point>();
  const [busy, setBusy] = useState(false);

  // Places of this entry's category: its own, and any elsewhere the reader
  // may edit and that could move inside it.
  const places = useMemo<WorldMapPlaceOption[]>(
    () =>
      Object.values(entries).flatMap((place): WorldMapPlaceOption[] => {
        if (place.id === entry.id || place.categoryId !== entry.categoryId)
          return [];
        if (place.parentEntryId === entry.id)
          return [
            { entry: place, where: pins[place.id] ? "pinned" : "inside" },
          ];
        if (
          !entryPermissions[place.id]?.canEdit ||
          !isValidWorldEntryParent(entries, place.id, entry.id)
        )
          return [];
        return [
          {
            entry: place,
            where: "elsewhere",
            parentName: place.parentEntryId
              ? entries[place.parentEntryId]?.name
              : undefined,
          },
        ];
      }),
    [entries, entryPermissions, pins, entry.id, entry.categoryId],
  );

  const pinAt = async (entryId: string, point: Point) => {
    try {
      if (entries[entryId] && entries[entryId].parentEntryId !== entry.id)
        await setEntryParent(entryId, entry.id);
      await setPin({
        entryId,
        mapEntryId: entry.id,
        ...snapToGrid(grid, point),
      });
    } catch (cause) {
      onError(cause);
    }
  };

  const onToolPointer = (event: WorldMapPointerEvent) => {
    if (event.phase !== "end") return;
    if (target.type === "entry") void pinAt(target.entryId, event.point);
    else setNewPlaceAt(event.point);
  };

  const createPlace = async (name: string, point: Point) => {
    if (!uid || target.type !== "new") return;
    const { readPermissions, editPermissions } = getLinkedWorldEntryPermissions(
      entry,
      {
        gmOnly: false,
        isGuide: !!permission && isGuideEquivalent(permission),
        guided,
      },
    );
    try {
      const createdId = await createEntry(
        uid,
        entry.worldId,
        entry.categoryId,
        name,
        readPermissions,
        editPermissions,
        entry.id,
      );
      await Promise.all([
        target.locationType && fieldId
          ? setFieldValue(
              createdId,
              entry.worldId,
              fieldId,
              target.locationType,
            )
          : undefined,
        setPin({
          entryId: createdId,
          mapEntryId: entry.id,
          ...snapToGrid(grid, point),
        }),
      ]);
    } catch (cause) {
      onError(cause);
      throw cause;
    }
  };

  const remove = (place: IWorldEntry) => {
    setBusy(true);
    removePin(place.id, entry.id)
      .catch(onError)
      .finally(() => setBusy(false));
  };

  const dialog = newPlaceAt && target.type === "new" && (
    <WorldMapNewPlaceDialog
      locationType={target.locationType}
      onCreate={(name) => createPlace(name, newPlaceAt)}
      onClose={() => setNewPlaceAt(undefined)}
    />
  );

  return {
    places,
    target,
    setTarget,
    locationTypes: types,
    selectedId: target.type === "entry" ? target.entryId : undefined,
    select: (place: IWorldEntry) =>
      setTarget({ type: "entry", entryId: place.id }),
    onToolPointer,
    onPinDrop: pinAt,
    remove,
    busy,
    dialog,
  };
}
