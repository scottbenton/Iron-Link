import { deleteDoc } from "firebase/firestore";

import { createApiFunction } from "api-calls/createApiFunction";
import { getHomebrewNonLinearMeterDoc } from "api-calls/homebrew/rules/nonLinearMeters/_getRef";

export const deleteHomebrewNonLinearMeter = createApiFunction<
  {
    meterId: string;
  },
  void
>((params) => {
  const { meterId } = params;
  return new Promise((resolve, reject) => {
    deleteDoc(getHomebrewNonLinearMeterDoc(meterId))
      .then(() => {
        resolve();
      })
      .catch(reject);
  });
}, "Failed to delete non-linear meter.");
