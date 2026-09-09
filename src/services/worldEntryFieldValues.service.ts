import { Json } from "types/supabase-generated.type";

import { byteaToUint8Array, uint8ArrayToBytea } from "lib/bytea.lib";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldEntryFieldValueDTO,
  WorldEntryFieldValuesRepository,
} from "repositories/worldEntryFieldValues.repository";

// text/number/tags values; richText and oracleText live in `content` instead.
export type WorldFieldValue = string | string[] | number;

export interface IWorldEntryFieldValue {
  entryId: string;
  fieldDefinitionId: string;
  worldId: string;
  // Mirrored from the field definition by the database; read-only here.
  gmOnly: boolean;
  value: WorldFieldValue | null;
}

export class WorldEntryFieldValuesService {
  public static listenToWorldEntryFieldValues(
    entryId: string,
    onValueChanges: (
      changedValues: Record<string, IWorldEntryFieldValue>,
      removedFieldDefinitionIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryFieldValuesRepository.listenToWorldEntryFieldValues(
      entryId,
      (changedValues, removedFieldDefinitionIds, replaceState) =>
        onValueChanges(
          Object.fromEntries(
            Object.entries(changedValues).map(([definitionId, value]) => [
              definitionId,
              this.convertValueDTOToValue(value),
            ]),
          ),
          removedFieldDefinitionIds,
          replaceState,
        ),
      onError,
    );
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
