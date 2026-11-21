import { describe, expect, it } from "vitest";

import {
  type IWorldFieldDefinition,
  WorldFieldType,
} from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";

import { getWorldEntryPreviewFields } from "../worldEntryPreview";
import { createWorldFieldConfiguration } from "../worldFieldRules";

const PLACES = "11111111-1111-4111-8111-111111111111";

const field = (
  id: string,
  type = WorldFieldType.Text,
  configuration: Partial<IWorldFieldDefinition["configuration"]> = {},
) => ({
  id,
  label: id.toUpperCase(),
  type,
  configuration: createWorldFieldConfiguration(configuration),
});

const entries = {
  haven: { name: "Frosthaven" } as IWorldEntry,
};

describe("getWorldEntryPreviewFields", () => {
  it("keeps fields with a value, in order, up to the limit", () => {
    const fields = ["a", "b", "c", "d", "e", "f"].map((id) => field(id));
    const values = {
      a: { value: "Captain" },
      b: { value: "   " },
      c: { value: null },
      d: { value: ["Brave", "Loyal"] },
      e: { value: "Tall" },
      f: { value: "Quiet" },
    };
    expect(getWorldEntryPreviewFields(fields, values, entries, 3)).toEqual([
      { id: "a", label: "A", text: "Captain" },
      { id: "d", label: "D", text: "Brave, Loyal" },
      { id: "e", label: "E", text: "Tall" },
    ]);
  });

  it("names linked entries this reader can see and skips the rest", () => {
    const home = field("home", WorldFieldType.Select, {
      targetCategoryId: PLACES,
      multiple: true,
    });
    const gone = field("gone", WorldFieldType.Select, {
      targetCategoryId: PLACES,
    });
    expect(
      getWorldEntryPreviewFields(
        [home, gone],
        { home: { value: ["haven", "hidden"] }, gone: { value: "hidden" } },
        entries,
      ),
    ).toEqual([{ id: "home", label: "HOME", text: "Frosthaven" }]);
  });

  it("is empty when nothing is filled in", () => {
    expect(getWorldEntryPreviewFields([field("a")], {}, entries)).toEqual([]);
  });
});
