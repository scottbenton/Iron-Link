import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { fieldChoiceLabel, validateFieldDraft } from "../categoryEditor.utils";
import { field, translate } from "./fixtures";

const t = translate as unknown as TFunction;

describe("fieldChoiceLabel", () => {
  it("names repeated labels by the subtype that shows them, for any source field", () => {
    const factionType = field({ id: "faction-type", label: "Faction Type" });
    const visibleWhen = (value: string) => ({
      ...createWorldFieldConfiguration(),
      rules: [
        {
          conditions: [
            {
              source: "entry" as const,
              fieldId: factionType.id,
              operator: "equals" as const,
              value,
            },
          ],
          visible: true,
        },
      ],
    });
    const cursed = field({
      id: "cursed",
      label: "Agenda",
      configuration: visibleWhen("Cursed"),
    });
    const dominion = field({
      id: "dominion",
      label: "Agenda",
      configuration: visibleWhen("Dominion"),
    });
    const fields = [factionType, cursed, dominion];

    expect(fieldChoiceLabel(cursed, fields, t)).toBe("Agenda (Cursed)");
    expect(fieldChoiceLabel(dominion, fields, t)).toBe("Agenda (Dominion)");
    expect(fieldChoiceLabel(factionType, fields, t)).toBe("Faction Type");
  });

  it("falls back to the type and position without a distinguishing subtype", () => {
    const first = field({ id: "first", label: "Notes" });
    const second = field({ id: "second", label: "Notes" });
    expect(fieldChoiceLabel(second, [first, second], t)).toBe(
      "Notes (Text, 2)",
    );
  });
});

describe("validateFieldDraft", () => {
  it("checks a field's own conditions against the draft being saved", () => {
    const edited = field({ id: "edited", label: "Kind" });
    const draft = {
      label: "Renamed",
      type: WorldFieldType.RichText,
      gmOnly: false,
      configuration: {
        ...createWorldFieldConfiguration(),
        rules: [
          {
            conditions: [
              {
                source: "entry" as const,
                fieldId: edited.id,
                operator: "equals" as const,
                value: "Planet",
              },
            ],
          },
        ],
      },
    };

    const result = validateFieldDraft(draft, [edited], edited.id);

    expect(result.sourceFields[0]).toMatchObject({
      label: "Renamed",
      type: WorldFieldType.RichText,
    });
    // Rich text cannot be compared, so its own condition is now invalid.
    expect(result.invalidCondition).toBe(true);
    expect(
      validateFieldDraft(draft, [edited], edited.id, true).sourceFields[0],
    ).toBe(edited);
  });
});
