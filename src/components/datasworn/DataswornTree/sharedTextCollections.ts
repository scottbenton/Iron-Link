import { Datasworn } from "@datasworn-community/core";

const sharedTextTypes: string[] = [
  "table_shared_text",
  "table_shared_text2",
  "table_shared_text3",
];

// A collection whose tables share one result column, rolled together.
export function isSharedTextCollection(
  collection: Datasworn.OracleCollection,
): collection is
  | Datasworn.OracleTableSharedText
  | Datasworn.OracleTableSharedText2
  | Datasworn.OracleTableSharedText3 {
  return sharedTextTypes.includes(collection.oracle_type);
}
