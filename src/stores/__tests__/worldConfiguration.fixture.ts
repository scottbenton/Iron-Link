import { v5 as uuidv5 } from "uuid";

import { WorldFieldType } from "types/worldField.type";

import { createWorldFieldConfiguration } from "lib/worldFieldConfiguration";

import type { IWorldCategory } from "services/worldCategories.service";
import type { WorldConfigurationSnapshot } from "services/worldConfigurationRead.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

/**
 * Small RPC response fixture for store behavior, independent of setting catalogs.
 * Three categories distinguish reversing from swapping; three fields exercise
 * ordering rollback. A second category supplies an unaffected field and a goal
 * binding for replacement and explicit-unbound-rule scenarios.
 */
export function createStoreConfigurationFixture(
  worldId: string,
): Pick<WorldConfigurationSnapshot, "categories" | "fieldDefinitions"> {
  const category = (
    key: string,
    name: string,
    sortOrder: number,
  ): IWorldCategory => ({
    id: uuidv5(`store-test/category/${key}`, worldId),
    worldId,
    name,
    icon: null,
    sortOrder,
    supportsHierarchy: false,
    supportsMap: false,
    supportsBonds: false,
    subtitleFieldDefinitionId: null,
  });
  const places = category("places", "Places", 0);
  const people = category("people", "People", 1);
  const notes = category("notes", "Notes", 2);
  const field = (
    categoryId: string,
    key: string,
    label: string,
    sortOrder: number,
  ): IWorldFieldDefinition => ({
    id: uuidv5(`store-test/field/${key}`, worldId),
    worldId,
    categoryId,
    key,
    label,
    type: WorldFieldType.Text,
    binding: null,
    configuration: createWorldFieldConfiguration(),
    gmOnly: false,
    sortOrder,
  });
  const fields = [
    field(places.id, "kind", "Kind", 0),
    field(places.id, "summary", "Summary", 1),
    field(places.id, "detail", "Detail", 2),
    field(people.id, "role", "Role", 0),
    {
      ...field(people.id, "goal", "Goal", 1),
      type: WorldFieldType.OracleText,
      binding: {
        packageId: "starforged",
        oracleId: "oracle_rollable:starforged/character/goal",
        resolvedOracleId: "oracle_rollable:starforged/character/goal",
      },
    },
  ];
  return {
    categories: Object.fromEntries(
      [places, people, notes].map((record) => [record.id, record]),
    ),
    fieldDefinitions: Object.fromEntries(
      fields.map((record) => [record.id, record]),
    ),
  };
}
