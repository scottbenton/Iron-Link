import { useMemo } from "react";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { getWorldEntrySubtitleOverrides } from "lib/worldEntrySubtitle";

import type { IWorldCategory } from "services/worldCategories.service";

// The fields a category's entries take their subtitle from: the subtitle
// field, and the fields that replace it for particular values of it.
export function useWorldEntrySubtitleFields(
  category: Pick<
    IWorldCategory,
    "subtitleFieldDefinitionId" | "subtitleOverrides"
  >,
) {
  const fieldDefinitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const { subtitleFieldDefinitionId, subtitleOverrides } = category;
  return useMemo(() => {
    const field = subtitleFieldDefinitionId
      ? fieldDefinitions[subtitleFieldDefinitionId]
      : undefined;
    return {
      field,
      overrides: getWorldEntrySubtitleOverrides(
        field,
        subtitleOverrides,
        fieldDefinitions,
      ),
    };
  }, [fieldDefinitions, subtitleFieldDefinitionId, subtitleOverrides]);
}
