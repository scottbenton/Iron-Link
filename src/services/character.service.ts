import { Enums, Json } from "types/supabase-generated.type";

import {
  CharacterDTO,
  CharacterRepository,
  InitiativeStatus,
  StatsMap,
} from "repositories/character.repository";
import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { ColorScheme, SpecialTrack } from "repositories/shared.types";

export type ICharacter = {
  id: string;
  uid: string;
  gameId: string | null;

  name: string;
  stats: StatsMap;
  conditionMeters: Record<string, number>; // Health, Sprit, Supply, etc.

  initiativeStatus: InitiativeStatus;
  momentum: number;

  specialTracks: Record<string, SpecialTrack>; // Bonds, Quests, Discoveries, etc.

  debilities: Record<string, boolean>;
  adds: number;

  profileImage: {
    filename: string;
    position: {
      x: number;
      y: number;
    };
    scale: number;
  } | null;

  unspentExperience: number;
  colorScheme: ColorScheme | null;
};

export class CharacterService {
  public static async getCharacter(characterId: string): Promise<ICharacter> {
    return CharacterService.convertCharacterDTOToCharacter(
      await CharacterRepository.getCharacter(characterId),
    );
  }

  private static convertCharacterDTOToCharacter(
    characterDTO: CharacterDTO,
  ): ICharacter {
    let initiativeStatus: InitiativeStatus;
    switch (characterDTO.initiative_status) {
      case "has_initiative":
        initiativeStatus = InitiativeStatus.HasInitiative;
        break;
      case "no_initiative":
        initiativeStatus = InitiativeStatus.DoesNotHaveInitiative;
        break;
      case "out_of_combat":
        initiativeStatus = InitiativeStatus.OutOfCombat;
        break;
    }

    let colorScheme: ColorScheme | null = null;
    if (characterDTO.color_scheme) {
      if (
        Object.values(ColorScheme).includes(
          characterDTO.color_scheme as ColorScheme,
        )
      ) {
        colorScheme = characterDTO.color_scheme as ColorScheme;
      }
    }

    return {
      id: characterDTO.id,
      uid: characterDTO.uid,
      gameId: characterDTO.game_id,
      name: characterDTO.name,
      stats: characterDTO.stat_values as Record<string, number>,
      conditionMeters: characterDTO.condition_meter_values as Record<
        string,
        number
      >,
      specialTracks: characterDTO.special_track_values as unknown as Record<
        string,
        SpecialTrack
      >,
      momentum: characterDTO.momentum,
      initiativeStatus,
      debilities: characterDTO.impact_values as Record<string, boolean>,
      adds: characterDTO.adds,
      unspentExperience: characterDTO.unspent_experience,
      colorScheme,
      profileImage: characterDTO.portrait_filename
        ? {
            filename: characterDTO.portrait_filename,
            position: {
              x: characterDTO.portrait_position_x ?? 0,
              y: characterDTO.portrait_position_y ?? 0,
            },
            scale: characterDTO.portrait_scale ?? 1,
          }
        : null,
    };
  }

  public static async getCharactersInGames(
    gameIds: string[],
  ): Promise<Record<string, ICharacter>> {
    const characterDTOs =
      await CharacterRepository.getCharactersInGames(gameIds);
    return Object.fromEntries(
      Object.entries(characterDTOs).map(([characterId, characterDTO]) => [
        characterId,
        this.convertCharacterDTOToCharacter(characterDTO),
      ]),
    );
  }

  public static listenToGameCharacters(
    gameId: string,
    onCharacterChanges: (
      changedCharacters: Record<string, ICharacter>,
      removedCharacterIds: string[],
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return CharacterRepository.listenToGameCharacters(
      gameId,
      (changedCharacters, removedCharacterIds) => {
        onCharacterChanges(
          Object.fromEntries(
            Object.entries(changedCharacters).map(
              ([characterId, characterDTO]) => [
                characterId,
                this.convertCharacterDTOToCharacter(characterDTO),
              ],
            ),
          ),
          removedCharacterIds,
        );
      },
      onError,
    );
  }

  public static getCharacterPortraitURL(
    characterId: string,
    filename: string,
  ): string {
    return CharacterRepository.getCharacterImageLink(characterId, filename);
  }

  public static async createCharacterAndAddToGame(params: {
    uid: string;
    gameId: string;
    name: string;
    stats: Record<string, number>;
    profileImage: {
      image: File | null;
      position: {
        x: number;
        y: number;
      };
      scale: number;
    };
  }): Promise<string> {
    const { uid, gameId, name, stats, profileImage } = params;

    const characterId = await CharacterRepository.createCharacter({
      uid,
      game_id: gameId,
      name,
      stat_values: stats,

      portrait_filename: profileImage.image ? profileImage.image.name : null,
      portrait_position_x: profileImage.position.x,
      portrait_position_y: profileImage.position.y,
      portrait_scale: profileImage.scale,
    });
    if (profileImage.image) {
      try {
        CharacterRepository.uploadCharacterImage(
          characterId,
          profileImage.image,
        );
      } catch (e) {
        console.error("Failed to upload portrait:", e);
      }
    }

    return characterId;
  }

  public static async removeCharacterPortrait(
    characterId: string,
    filename: string,
  ): Promise<void> {
    const promises: Promise<unknown>[] = [];
    promises.push(
      CharacterRepository.updateCharacter(characterId, {
        portrait_filename: null,
      }),
    );
    promises.push(
      CharacterRepository.deleteCharacterPortrait(characterId, filename),
    );
    await Promise.all(promises);
  }

  public static async updateCharacterName(characterId: string, name: string) {
    return CharacterRepository.updateCharacter(characterId, { name });
  }

  public static async updateCharacterPortrait(
    characterId: string,
    scale: number,
    position: { x: number; y: number },
    oldFilename?: string,
    newPortrait?: File,
  ) {
    const promises: Promise<unknown>[] = [];
    if (oldFilename) {
      promises.push(
        CharacterRepository.deleteCharacterPortrait(characterId, oldFilename),
      );
    }
    if (newPortrait) {
      promises.push(
        CharacterRepository.uploadCharacterImage(characterId, newPortrait),
      );
    }

    promises.push(
      CharacterRepository.updateCharacter(
        characterId,
        newPortrait
          ? {
              portrait_filename: newPortrait.name,
              portrait_position_x: position.x,
              portrait_position_y: position.y,
              portrait_scale: scale,
            }
          : {
              portrait_position_x: position.x,
              portrait_position_y: position.y,
              portrait_scale: scale,
            },
      ),
    );
    await Promise.all(promises);
  }

  public static async updateCharacterStats(
    characterId: string,
    stats: Record<string, number>,
  ) {
    return CharacterRepository.updateCharacter(characterId, {
      stat_values: stats,
    });
  }

  public static async updateCharacterColorScheme(
    characterId: string,
    colorScheme: ColorScheme | null,
  ) {
    return CharacterRepository.updateCharacter(characterId, {
      color_scheme: colorScheme,
    });
  }

  public static async updateCharacterInitiativeStatus(
    characterId: string,
    initiativeStatus: InitiativeStatus,
  ) {
    let status: Enums<"character_initiative_status"> = "out_of_combat";
    if (initiativeStatus === InitiativeStatus.HasInitiative) {
      status = "has_initiative";
    } else if (initiativeStatus === InitiativeStatus.DoesNotHaveInitiative) {
      status = "no_initiative";
    }
    return CharacterRepository.updateCharacter(characterId, {
      initiative_status: status,
    });
  }

  public static async updateAdds(
    characterId: string,
    adds: number,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, { adds });
  }

  public static updateConditionMeters(
    characterId: string,
    conditionMeters: Record<string, number>,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, {
      condition_meter_values: conditionMeters,
    });
  }

  public static updateMomentum(
    characterId: string,
    momentum: number,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, { momentum });
  }

  public static updateImpacts(
    characterId: string,
    impacts: Record<string, boolean>,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, {
      impact_values: impacts,
    });
  }

  public static updateSpecialTracks(
    characterId: string,
    specialTracks: Record<string, SpecialTrack>,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, {
      special_track_values: specialTracks as unknown as Json,
    });
  }

  public static updateExperience(
    characterId: string,
    experience: number,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, {
      unspent_experience: experience,
    });
  }

  public static async deleteCharacter(characterId: string): Promise<void> {
    return CharacterRepository.deleteCharacter(characterId);
  }

  public static async removeCharacterFromGame(
    characterId: string,
  ): Promise<void> {
    return CharacterRepository.updateCharacter(characterId, { game_id: null });
  }
}
