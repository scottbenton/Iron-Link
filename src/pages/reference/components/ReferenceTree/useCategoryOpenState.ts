import { useEffect, useState } from "react";

import { useReferenceTreeContext } from "./referenceTreeContext";

// Whether a category is open. It starts open when it holds the open item,
// and opens again when another item inside it is opened. While the filter
// holds text every category with a match is open; one closed then stays
// closed until the filter changes.
export function useCategoryOpenState(
  collectionId: string,
): [boolean, (open: boolean) => void] {
  const { openCollectionIds, selectedId, search } = useReferenceTreeContext();
  const containsSelectedItem = openCollectionIds.has(collectionId);

  const [isOpen, setIsOpen] = useState(containsSelectedItem);
  useEffect(() => {
    if (containsSelectedItem) setIsOpen(true);
  }, [containsSelectedItem, selectedId]);

  // The filter text this category was closed under, if any.
  const [closedForSearch, setClosedForSearch] = useState<string | null>(null);

  if (search) {
    return [
      closedForSearch !== search,
      (open) => setClosedForSearch(open ? null : search),
    ];
  }
  return [isOpen, setIsOpen];
}
