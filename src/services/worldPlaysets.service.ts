import type { LinkedGamePlayset } from "lib/effectivePlayset";

import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";

export class WorldPlaysetsService {
  // The playsets of every game linked to the world. Their union is the world's
  // effective playset; it is derived on read and never stored.
  public static getLinkedGamePlaysets(
    worldId: string,
  ): Promise<LinkedGamePlayset[]> {
    return WorldPlaysetsRepository.getLinkedGamePlaysets(worldId);
  }
}
