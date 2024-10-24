import { deleteField } from "firebase/firestore";

import { createApiFunction } from "api-calls/createApiFunction";
import { constructLocationImagesPath } from "api-calls/world/locations/_getRef";
import { updateLocation } from "api-calls/world/locations/updateLocation";
import { deleteImage } from "lib/storage.lib";

export const removeLocationMapBackgroundImage = createApiFunction<
  {
    worldId: string;
    locationId: string;
    filename: string;
  },
  void
>((params) => {
  const { worldId, locationId, filename } = params;

  return new Promise((resolve, reject) => {
    updateLocation({
      worldId,
      locationId,
      location: { mapBackgroundImageFilename: deleteField() },
    })
      .then(() => {
        deleteImage(
          constructLocationImagesPath(worldId, locationId),
          filename,
        ).catch(() => console.error("Failed to remove image from storage."));
        resolve();
      })
      .catch(reject);
  });
}, "Failed to delete location image.");
