import {
  ExpansionConfig,
  GameDTO,
  GameRepostiory,
  GameType,
  RulesetConfig,
} from "repositories/game.repository";
import {
  GamePlayerDTO,
  GamePlayersRepository,
} from "repositories/gamePlayers.repository";
import { ColorScheme, SpecialTrack } from "repositories/shared.types";

export type IGame = {
  id: string;
  name: string;
  worldId: string | null;
  conditionMeters: Record<string, number>;
  specialTracks: Record<string, SpecialTrack>;
  gameType: GameType;
  colorScheme: ColorScheme | null;

  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
};

export enum GamePlayerRole {
  Player = "player",
  Guide = "guide",
}

export interface IGamePlayer extends GamePlayerDTO {
  role: GamePlayerRole;
}

export class GameService {
  public static async createGame(
    uid: string,
    gameName: string,
    gameType: GameType,
    rulesets: Record<string, boolean>,
    expansions: Record<string, Record<string, boolean>>,
  ): Promise<string> {
    const gameId = await GameRepostiory.createGame(
      gameName,
      gameType,
      rulesets,
      expansions,
    );

    let role: GamePlayerDTO["role"] = "player";

    if (gameType === GameType.Coop) {
      role = "guide";
    } else if (gameType === GameType.Solo) {
      role = "guide";
    }

    await GamePlayersRepository.addPlayerToGame(gameId, uid, role);

    return gameId;
  }

  public static async getGameInviteInfo(
    gameId: string,
    userId: string,
  ): Promise<{
    name: string;
    gameType: GameType;
    isPlayer: boolean;
  }> {
    const isPlayerInGame =
      await GamePlayersRepository.getGamePlayerEntryIfExists(gameId, userId);
    if (isPlayerInGame) {
      return {
        name: "",
        gameType: GameType.Solo,
        isPlayer: true,
      };
    }
    const result = await GameRepostiory.getGameInviteInfo(gameId);

    let gameType: GameType = GameType.Solo;
    if (result.game_type === "co-op") {
      gameType = GameType.Coop;
    } else if (result.game_type === "guided") {
      gameType = GameType.Guided;
    }

    return {
      name: result.name,
      gameType,
      isPlayer: false,
    };
  }

  public static listenToGame(
    gameId: string,
    onUpdate: (game: IGame) => void,
    onError: (error: Error) => void,
  ): () => void {
    return GameRepostiory.listenToGame(
      gameId,
      (gameDTO) => {
        onUpdate(this.convertGameDTOToGame(gameDTO));
      },
      onError,
    );
  }

  public static async getUsersGames(
    uid: string,
  ): Promise<Record<string, IGame>> {
    const games = await GameRepostiory.getUsersGames(uid);
    return Object.fromEntries(
      games.map((gameDTO) => [gameDTO.id, this.convertGameDTOToGame(gameDTO)]),
    );
  }

  public static async changeName(
    gameId: string,
    newName: string,
  ): Promise<void> {
    await GameRepostiory.updateGame(gameId, { name: newName });
  }

  public static async addPlayer(
    gameId: string,
    gameType: GameType,
    playerId: string,
  ): Promise<void> {
    const role = this.getDefaultPlayerRoleForGameType(gameType);
    await GamePlayersRepository.addPlayerToGame(gameId, playerId, role);
  }

  public static async removePlayer(
    gameId: string,
    playerId: string,
  ): Promise<void> {
    await GamePlayersRepository.removePlayerFromGame(gameId, playerId);
  }

  public static async addGuide(gameId: string, guideId: string): Promise<void> {
    await GamePlayersRepository.updateGamePlayerRole(gameId, guideId, "guide");
  }

  public static async removeGuide(
    gameId: string,
    guideId: string,
  ): Promise<void> {
    await GamePlayersRepository.updateGamePlayerRole(gameId, guideId, "player");
  }

  public static async updateConditionMeters(
    gameId: string,
    updatedConditionMeters: Record<string, number>,
  ): Promise<void> {
    await GameRepostiory.updateGame(gameId, {
      condition_meter_values: updatedConditionMeters,
    });
  }

  public static async updateSpecialTracks(
    gameId: string,
    specialTracks: Record<string, SpecialTrack>,
  ): Promise<void> {
    await GameRepostiory.updateGame(gameId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      special_track_values: specialTracks as unknown as any,
    });
  }

  public static async changeGameType(gameId: string, gameType: GameType) {
    const role = this.getDefaultPlayerRoleForGameType(gameType);
    await GamePlayersRepository.updateAllGamePlayerRoles(gameId, role);
    await GameRepostiory.updateGame(gameId, { game_type: gameType });
  }

  public static async updateRules(
    gameId: string,
    rulesets: RulesetConfig,
    expansions: ExpansionConfig,
  ): Promise<void> {
    await GameRepostiory.updateGame(gameId, { rulesets, expansions });
  }

  public static async updateColorScheme(
    gameId: string,
    colorScheme: ColorScheme,
  ) {
    await GameRepostiory.updateGame(gameId, { color_scheme: colorScheme });
  }

  private static convertGameDTOToGame(gameDTO: GameDTO): IGame {
    let gameType = GameType.Solo;
    if (gameDTO.game_type === "co-op") {
      gameType = GameType.Coop;
    } else if (gameDTO.game_type === "guided") {
      gameType = GameType.Guided;
    }

    let colorScheme: ColorScheme | null = null;
    if (gameDTO.color_scheme === ColorScheme.Cinder) {
      colorScheme = ColorScheme.Cinder;
    } else if (gameDTO.color_scheme === ColorScheme.Eidolon) {
      colorScheme = ColorScheme.Eidolon;
    } else if (gameDTO.color_scheme === ColorScheme.Hinterlands) {
      colorScheme = ColorScheme.Hinterlands;
    } else if (gameDTO.color_scheme === ColorScheme.Myriad) {
      colorScheme = ColorScheme.Myriad;
    } else if (gameDTO.color_scheme === ColorScheme.Mystic) {
      colorScheme = ColorScheme.Mystic;
    }

    return {
      id: gameDTO.id,
      name: gameDTO.name,
      worldId: null,
      conditionMeters: (gameDTO.condition_meter_values ?? {}) as Record<
        string,
        number
      >,
      specialTracks: (gameDTO.special_track_values ?? {}) as unknown as Record<
        string,
        SpecialTrack
      >,
      gameType,
      colorScheme,
      rulesets: gameDTO.rulesets as Record<string, boolean>,
      expansions: gameDTO.expansions as Record<string, Record<string, boolean>>,
    };
  }

  public static deleteGame(gameId: string): Promise<void> {
    return GameRepostiory.deleteGame(gameId);
  }

  private static getDefaultPlayerRoleForGameType(
    gameType: GameType,
  ): GamePlayerDTO["role"] {
    if (gameType === GameType.Coop) {
      return "guide";
    } else if (gameType === GameType.Solo) {
      return "guide";
    }
    return "player";
  }
}
