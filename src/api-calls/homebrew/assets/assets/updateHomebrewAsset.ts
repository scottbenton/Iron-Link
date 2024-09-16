import { createApiFunction } from "api-calls/createApiFunction";
import { PartialWithFieldValue, updateDoc } from "firebase/firestore";
import { getHomebrewAssetDoc } from "./_getRef";
import { HomebrewAssetDocument } from "api-calls/homebrew/assets/assets/_homebrewAssets.type";

export const updateHomebrewAsset = createApiFunction<
  {
    assetId: string;
    asset: PartialWithFieldValue<HomebrewAssetDocument>;
  },
  void
>((params) => {
  const { assetId, asset } = params;
  return new Promise((resolve, reject) => {
    updateDoc(getHomebrewAssetDoc(assetId), asset).then(resolve).catch(reject);
  });
}, "Failed to update asset.");
