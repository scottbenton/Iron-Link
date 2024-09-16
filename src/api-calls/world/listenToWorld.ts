import { onSnapshot } from "firebase/firestore";
import { World } from "api-calls/world/_world.type";
import { decodeWorld, getWorldDoc } from "./_getRef";

export function listenToWorld(
  worldId: string,
  onDocChange: (data?: World) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any) => void
) {
  return onSnapshot(
    getWorldDoc(worldId),
    (snapshot) => {
      const encodedWorld = snapshot.data();
      if (encodedWorld) {
        onDocChange(decodeWorld(encodedWorld));
      } else {
        onDocChange(undefined);
      }
    },
    (error) => onError(error)
  );
}
