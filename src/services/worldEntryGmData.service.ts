import { Buffer } from "buffer";

import { Json } from "types/supabase-generated.type";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldEntryGmDataDTO,
  WorldEntryGmDataRepository,
} from "repositories/worldEntryGmData.repository";

import { WorldEntryFieldValue } from "./worldEntries.service";

export interface IWorldEntryGmData {
  entryId: string;
  worldId: string;
  fields: Record<string, WorldEntryFieldValue>;
}

export class WorldEntryGmDataService {
  public static listenToWorldEntryGmData(
    worldId: string,
    onGmDataChanges: (
      changedGmData: Record<string, IWorldEntryGmData>,
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryGmDataRepository.listenToWorldEntryGmData(
      worldId,
      (changedGmData, removedEntryIds, replaceState) =>
        onGmDataChanges(
          Object.fromEntries(
            Object.entries(changedGmData).map(([entryId, gmData]) => [
              entryId,
              this.convertGmDataDTOToGmData(gmData),
            ]),
          ),
          removedEntryIds,
          replaceState,
        ),
      onError,
    );
  }

  public static updateWorldEntryGmFields(
    entryId: string,
    worldId: string,
    fields: Record<string, WorldEntryFieldValue>,
  ): Promise<void> {
    return WorldEntryGmDataRepository.upsertWorldEntryGmData({
      entry_id: entryId,
      world_id: worldId,
      fields: fields as unknown as Json,
    });
  }

  public static updateWorldEntryGmNotesContent(
    entryId: string,
    worldId: string,
    content: Uint8Array,
  ): Promise<void> {
    return WorldEntryGmDataRepository.upsertWorldEntryGmData({
      entry_id: entryId,
      world_id: worldId,
      gm_notes_content: this.uint8ArrayToDatabase(content),
    });
  }

  public static async getWorldEntryGmNotesContent(
    entryId: string,
  ): Promise<{ content: Uint8Array }> {
    const gmData =
      await WorldEntryGmDataRepository.getWorldEntryGmNotesContent(entryId);
    return {
      content: gmData?.gm_notes_content
        ? this.databaseToUint8Array(gmData.gm_notes_content)
        : new Uint8Array(),
    };
  }

  private static convertGmDataDTOToGmData(
    gmData: WorldEntryGmDataDTO,
  ): IWorldEntryGmData {
    return {
      entryId: gmData.entry_id,
      worldId: gmData.world_id,
      fields:
        gmData.fields && typeof gmData.fields === "object"
          ? (gmData.fields as Record<string, WorldEntryFieldValue>)
          : {},
    };
  }

  private static uint8ArrayToDatabase(arr: Uint8Array): string {
    return "\\x" + Buffer.from(arr).toString("hex");
  }
  private static databaseToUint8Array(str: string): Uint8Array {
    return Buffer.from(str.slice(2), "hex");
  }
}
