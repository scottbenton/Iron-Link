import { createApiFunction } from "api-calls/createApiFunction";
import { addDoc } from "firebase/firestore";
import { Roll } from "types/DieRolls.type";
import {
  convertRollToGameLogDocument,
  getCampaignGameLogCollection,
  getCharacterGameLogCollection,
} from "./_getRef";

export const addRoll = createApiFunction<
  { roll: Roll; campaignId?: string; characterId?: string },
  string
>((params) => {
  const { characterId, campaignId, roll } = params;

  return new Promise((resolve, reject) => {
    if (!characterId && !campaignId) {
      reject(new Error("Either campaign or character ID must be defined."));
    }

    addDoc(
      campaignId
        ? getCampaignGameLogCollection(campaignId)
        : getCharacterGameLogCollection(characterId as string),
      convertRollToGameLogDocument(roll)
    )
      .then((doc) => {
        resolve(doc.id);
      })
      .catch((e) => {
        reject(e);
      });
  });
}, "Failed to add roll to log.");
