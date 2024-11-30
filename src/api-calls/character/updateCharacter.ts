import { UpdateData, updateDoc } from "firebase/firestore";

import { createApiFunction } from "api-calls/createApiFunction";

import { CharacterDocument } from "./_character.type";
import { getCharacterDoc } from "./_getRef";

interface Params {
  characterId: string;
  character: UpdateData<CharacterDocument>;
}

export const updateCharacter = createApiFunction<Params, void>((params) => {
  const { characterId, character } = params;

  return new Promise((resolve, reject) => {
    updateDoc(getCharacterDoc(characterId), character)
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  });
}, "Failed to update character.");
