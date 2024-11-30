import { Unsubscribe } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

import { getErrorMessage } from "lib/getErrorMessage";

import { getPublicNotesLocationDoc } from "./_getRef";

export function listenToLocationNotes(
  worldId: string,
  locationId: string,
  updateLocationNotes: (notes: Uint8Array | undefined) => void,
  onError: (error: string) => void,
): Unsubscribe {
  return onSnapshot(
    getPublicNotesLocationDoc(worldId, locationId),
    (snapshot) => {
      const notes = snapshot.data()?.notes?.toUint8Array();
      updateLocationNotes(notes);
    },
    (error) => {
      onError(getErrorMessage(error, "Failed to get location notes"));
    },
  );
}
