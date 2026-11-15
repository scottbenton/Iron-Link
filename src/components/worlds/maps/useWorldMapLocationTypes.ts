import { useEffect, useMemo, useState } from "react";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { normalizeWorldFieldConfiguration } from "lib/worldFieldConfiguration";

// The Location Types a category offers for new places: its field's
// configured options, then the ones its entries already use.
export function useWorldMapLocationTypes(categoryId: string) {
  const field = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions).find(
      (definition) =>
        definition.categoryId === categoryId &&
        definition.key === "locationType",
    ),
  );
  const getFieldOptions = useWorldCategoriesStore(
    (store) => store.getFieldOptions,
  );
  const [used, setUsed] = useState<string[]>([]);
  const fieldId = field?.id;
  useEffect(() => {
    if (!fieldId) return;
    let active = true;
    getFieldOptions(fieldId)
      .then((options) => active && setUsed(options))
      // The configured options still work.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [fieldId, getFieldOptions]);

  const types = useMemo(() => {
    if (!field) return [];
    const { suggestions } = normalizeWorldFieldConfiguration(
      field.configuration,
      field.type,
    );
    const seen = new Set<string>();
    return [...suggestions, ...used]
      .map((type) => type.trim())
      .filter((type) => {
        const key = type.toLowerCase();
        if (!type || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [field, used]);

  return { fieldId, types };
}
