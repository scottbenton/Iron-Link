import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  RoomKeySource,
  RoomKeysRepository,
} from "repositories/roomKeys.repository";

export type { RoomKeySource };

export class RoomKeysService {
  public static listenToRoomKey(
    source: RoomKeySource,
    onKey: (key: string | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return RoomKeysRepository.listenToRoomKey(source, onKey, onError);
  }
}
