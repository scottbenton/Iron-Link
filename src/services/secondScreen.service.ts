import {
  GameSecondScreenDTO,
  SecondScreenRepository,
} from "repositories/secondScreen.repository";

interface ISecondScreenCharacterDisplay {
  type: "character";
  characterId: string;
}
interface ISecondScreenTrackDisplay {
  type: "track";
  trackId: string;
}
interface ISecondScreenNoteImageDisplay {
  type: "note_image";
  url: string;
  label: string;
}

export type ISecondScreenDisplay =
  | ISecondScreenCharacterDisplay
  | ISecondScreenTrackDisplay
  | ISecondScreenNoteImageDisplay
  | null;

export class SecondScreenService {
  public static listenToSecondScreenSettings(
    gameId: string,
    onSettings: (
      settings: ISecondScreenDisplay,
      areAllCharactersVisible: boolean,
    ) => void,
    onError: (error: Error) => void,
  ): () => void {
    return SecondScreenRepository.listenToSecondScreenSettings(
      gameId,
      (settings) => {
        onSettings(
          this.convertSecondScreenDTOToDisplay(settings),
          settings?.show_all_characters_second_screen ?? false,
        );
      },
      onError,
    );
  }

  public static async updateSecondScreenSettings(
    gameId: string,
    settings: ISecondScreenDisplay,
  ) {
    if (settings === null) {
      return SecondScreenRepository.updateSecondScreenSettings(gameId, {
        type: null,
        options: {},
      });
    } else if (settings.type === "character") {
      return SecondScreenRepository.updateSecondScreenSettings(gameId, {
        type: "character",
        options: { character_id: settings.characterId },
      });
    } else if (settings.type === "track") {
      return SecondScreenRepository.updateSecondScreenSettings(gameId, {
        type: "track",
        options: { track_id: settings.trackId },
      });
    } else if (settings.type === "note_image") {
      return SecondScreenRepository.updateSecondScreenSettings(gameId, {
        type: "note_image",
        options: { url: settings.url, label: settings.label },
      });
    }
  }

  public static updateAreAllCharactersVisible(
    gameId: string,
    areAllCharactersVisible: boolean,
  ) {
    return SecondScreenRepository.updateSecondScreenSettings(gameId, {
      show_all_characters_second_screen: areAllCharactersVisible,
    });
  }

  private static convertSecondScreenDTOToDisplay(
    dto: GameSecondScreenDTO | null,
  ): ISecondScreenDisplay {
    if (!dto) {
      return null;
    } else if (dto.type === "character") {
      return {
        type: "character",
        characterId: (dto.options as { character_id: string }).character_id,
      };
    } else if (dto.type === "track") {
      return {
        type: "track",
        trackId: (dto.options as { track_id: string }).track_id,
      };
    } else if (dto.type === "note_image") {
      const options = dto.options as { url: string; label: string };
      return {
        type: "note_image",
        url: options.url,
        label: options.label,
      };
    } else {
      return null;
    }
  }
}
