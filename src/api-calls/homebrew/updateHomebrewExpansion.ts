import { PartialWithFieldValue, updateDoc } from "firebase/firestore";
import { getHomebrewCollectionDoc } from "./_getRef";
import { ExpansionDocument } from "api-calls/homebrew/_homebrewCollection.type";
import { createApiFunction } from "api-calls/createApiFunction";

export const updateHomebrewExpansion = createApiFunction<
  { id: string; expansion: PartialWithFieldValue<ExpansionDocument> },
  void
>((params) => {
  const { id, expansion } = params;

  return new Promise((resolve, reject) => {
    updateDoc(getHomebrewCollectionDoc(id), expansion)
      .then(() => resolve())
      .catch(reject);
  });
}, "Failed to update expansion.");
