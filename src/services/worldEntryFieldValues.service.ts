import { Json } from "types/supabase-generated.type";

import { byteaToUint8Array, uint8ArrayToBytea } from "lib/bytea.lib";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldEntryFieldValueDTO,
  WorldEntryFieldValueKey,
  WorldEntryFieldValuesRepository,
} from "repositories/worldEntryFieldValues.repository";

// Text and single Select values are strings; multi Selects store arrays.
// Linked Selects store entry IDs. Rich text lives in `content` instead.
export type WorldFieldValue = string | string[];

export interface IWorldEntryFieldValue {
  entryId: string;
  fieldDefinitionId: string;
  worldId: string;
  // Mirrored from the field definition by the database; read-only here.
  gmOnly: boolean;
  value: WorldFieldValue | null;
}

export class WorldEntryFieldValuesService {
  public static listenToWorldFieldValues(
    worldId: string,
    onValueChanges: (
      changedValues: IWorldEntryFieldValue[],
      removedValues: WorldEntryFieldValueKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryFieldValuesRepository.listenToWorldFieldValues(
      worldId,
      (changedValues, removedValues, replaceState) =>
        onValueChanges(
          changedValues.map((value) => this.convertValueDTOToValue(value)),
          removedValues,
          replaceState,
        ),
      onError,
    );
  }

  public static async getWorldEntryFieldValues(
    entryId: string,
  ): Promise<IWorldEntryFieldValue[]> {
    const values =
      await WorldEntryFieldValuesRepository.getWorldEntryFieldValues(entryId);
    return values.map((value) => this.convertValueDTOToValue(value));
  }

  public static setWorldEntryFieldValue(
    entryId: string,
    worldId: string,
    fieldDefinitionId: string,
    value: WorldFieldValue | null,
  ): Promise<void> {
    return WorldEntryFieldValuesRepository.upsertWorldEntryFieldValue({
      entry_id: entryId,
      world_id: worldId,
      field_definition_id: fieldDefinitionId,
      value: value as unknown as Json,
    });
  }

  public static setWorldEntryFieldContent(
    entryId: string,
    worldId: string,
    fieldDefinitionId: string,
    content: Uint8Array,
  ): Promise<void> {
    return WorldEntryFieldValuesRepository.upsertWorldEntryFieldValue({
      entry_id: entryId,
      world_id: worldId,
      field_definition_id: fieldDefinitionId,
      content: uint8ArrayToBytea(content),
    });
  }

  public static async getWorldEntryFieldContent(
    entryId: string,
    fieldDefinitionId: string,
  ): Promise<{ content: Uint8Array }> {
    const row =
      await WorldEntryFieldValuesRepository.getWorldEntryFieldValueContent(
        entryId,
        fieldDefinitionId,
      );
    return {
      content: row?.content ? byteaToUint8Array(row.content) : new Uint8Array(),
    };
  }

  public static deleteWorldEntryFieldValue(
    entryId: string,
    fieldDefinitionId: string,
  ): Promise<void> {
    return WorldEntryFieldValuesRepository.deleteWorldEntryFieldValue(
      entryId,
      fieldDefinitionId,
    );
  }

  // Picks columns explicitly so realtime rows' rich text `content` is dropped.
  private static convertValueDTOToValue(
    value: WorldEntryFieldValueDTO,
  ): IWorldEntryFieldValue {
    return {
      entryId: value.entry_id,
      fieldDefinitionId: value.field_definition_id,
      worldId: value.world_id,
      gmOnly: value.gm_only,
      value: (value.value as WorldFieldValue | null) ?? null,
    };
  }
}
