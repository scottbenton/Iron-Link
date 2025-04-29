import { ICharacter } from "@/services/character.service";

export interface CharacterRollOptionState {
  name: string;
  stats: ICharacter["stats"];
  conditionMeters: ICharacter["conditionMeters"];
  adds: ICharacter["adds"];
  momentum: ICharacter["momentum"];
  specialTracks: ICharacter["specialTracks"];
}
