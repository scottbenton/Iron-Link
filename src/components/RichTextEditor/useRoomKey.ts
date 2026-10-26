import { useEffect, useState } from "react";

import { RoomKeySource, RoomKeysService } from "services/roomKeys.service";

function getSourceId(source: RoomKeySource) {
  return Object.entries(source)
    .map(([kind, id]) => `${kind}:${id}`)
    .join();
}

// The password for a live editing room: undefined while it loads, null when
// this user cannot read it (they edit without a live room), and a new value
// after each rotation.
export function useRoomKey(source: RoomKeySource): string | null | undefined {
  const sourceId = getSourceId(source);
  const [key, setKey] = useState<{ sourceId: string; key: string | null }>();

  useEffect(() => {
    const [kind, id] = sourceId.split(":");
    return RoomKeysService.listenToRoomKey(
      { [kind]: id } as RoomKeySource,
      (key) => setKey({ sourceId, key }),
      () => setKey({ sourceId, key: null }),
    );
  }, [sourceId]);

  return key?.sourceId === sourceId ? key.key : undefined;
}
