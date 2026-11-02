import { describe, expect, it } from "vitest";

import {
  type IWorldFieldDefinition,
  WorldFieldType,
} from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";
import type { IWorldEntryFieldValue } from "services/worldEntryFieldValues.service";

import { getWorldEntriesLinkingTo } from "../worldEntryLinks";
import { getWorldEntrySubtitle } from "../worldEntrySubtitle";
import { createWorldFieldConfiguration } from "../worldFieldRules";
import { buildWorldFieldEntrySnapshots } from "../worldFieldSnapshot";

const PLACES = "11111111-1111-4111-8111-111111111111";

const definition = (
  type: WorldFieldType,
  configuration: Partial<IWorldFieldDefinition["configuration"]> = {},
  id = "subtitle",
): IWorldFieldDefinition => ({
  id,
  categoryId: "people",
  worldId: "world",
  key: id,
  label: id,
  type,
  binding: null,
  gmOnly: false,
  sortOrder: 0,
  configuration: createWorldFieldConfiguration(configuration),
});

const entry = (
  id: string,
  name: string,
  categoryId = "people",
  parentEntryId: string | null = null,
) => ({ id, name, categoryId, parentEntryId }) as IWorldEntry;

const entries = Object.fromEntries(
  [
    entry("kell", "Kell"),
    entry("haven", "Frosthaven", PLACES),
    entry("keep", "Old Keep", PLACES),
  ].map((item) => [item.id, item]),
);

function valuesFor(
  values: Record<string, Record<string, IWorldEntryFieldValue["value"]>>,
) {
  return Object.fromEntries(
    Object.entries(values).map(([entryId, fields]) => [
      entryId,
      Object.fromEntries(
        Object.entries(fields).map(([fieldDefinitionId, value]) => [
          fieldDefinitionId,
          {
            entryId,
            fieldDefinitionId,
            worldId: "world",
            gmOnly: false,
            value,
          },
        ]),
      ),
    ]),
  );
}

function subtitle(
  field: IWorldFieldDefinition | undefined,
  value: IWorldEntryFieldValue["value"] | undefined,
) {
  const snapshots = buildWorldFieldEntrySnapshots(
    entries,
    valuesFor(value === undefined ? {} : { kell: { subtitle: value } }),
  );
  return getWorldEntrySubtitle(field, "kell", snapshots, entries);
}

describe("getWorldEntrySubtitle", () => {
  it("renders each field kind", () => {
    expect(subtitle(definition(WorldFieldType.Text), "Smith")).toBe("Smith");
    expect(
      subtitle(definition(WorldFieldType.Select, { multiple: false }), "Ally"),
    ).toBe("Ally");
    expect(
      subtitle(definition(WorldFieldType.Select, { multiple: true }), [
        "Ally",
        "Trader",
      ]),
    ).toBe("Ally, Trader");
    expect(
      subtitle(
        definition(WorldFieldType.Select, {
          targetCategoryId: PLACES,
          multiple: true,
        }),
        ["haven", "unreadable", "keep"],
      ),
    ).toBe("Frosthaven, Old Keep");
  });

  it("shows nothing without a subtitle field or value", () => {
    expect(subtitle(undefined, "Smith")).toBeUndefined();
    expect(
      subtitle(definition(WorldFieldType.Text), undefined),
    ).toBeUndefined();
    expect(subtitle(definition(WorldFieldType.Text), "  ")).toBeUndefined();
    expect(
      subtitle(
        definition(WorldFieldType.Select, { targetCategoryId: PLACES }),
        "unreadable",
      ),
    ).toBeUndefined();
  });

  it("follows the field's effective visibility", () => {
    expect(
      subtitle(definition(WorldFieldType.Text, { visible: false }), "Smith"),
    ).toBeUndefined();
    expect(
      subtitle(
        definition(WorldFieldType.Text, {
          visible: false,
          rules: [
            {
              conditions: [
                {
                  source: "entry",
                  fieldId: "subtitle",
                  operator: "isNotEmpty",
                },
              ],
              visible: true,
            },
          ],
        }),
        "Smith",
      ),
    ).toBe("Smith");
  });
});

describe("getWorldEntriesLinkingTo", () => {
  it("names the loaded entries whose linked entry values point at an entry", () => {
    const home = definition(
      WorldFieldType.Select,
      { targetCategoryId: PLACES, multiple: false },
      "home",
    );
    const visited = definition(
      WorldFieldType.Select,
      { targetCategoryId: PLACES, multiple: true },
      "visited",
    );
    const nickname = definition(WorldFieldType.Text, {}, "nickname");
    const people = Object.fromEntries(
      [
        entry("kell", "Kell"),
        entry("ash", "Ash"),
        entry("bram", "Bram"),
        entry("haven", "Frosthaven", PLACES),
      ].map((item) => [item.id, item]),
    );
    const linking = getWorldEntriesLinkingTo(
      people.haven,
      { home, visited, nickname },
      valuesFor({
        kell: { home: "haven" },
        ash: { visited: ["keep", "haven"] },
        bram: { nickname: "haven" },
        hidden: { home: "haven" },
      }),
      people,
    );
    expect(linking.map((item) => item.name)).toEqual(["Ash", "Kell"]);
  });
});
