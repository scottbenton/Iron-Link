import { RepositoryError } from "@/repositories/errors/RepositoryErrors";
import {
  ExpansionConfig,
  GameDTO,
  GameRepository,
  GameType,
  PlaysetConfig,
  RulesetConfig,
} from "@/repositories/game.repository";
import { GameInviteKeyRepository } from "@/repositories/gameInviteKey.repository";
import {
  GamePlayerDTO,
  GamePlayersRepository,
} from "@/repositories/gamePlayers.repository";
import { ColorScheme, SpecialTrack } from "@/repositories/shared.types";

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
  playset: PlaysetConfig;
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
    playset: PlaysetConfig,
  ): Promise<string> {
    const gameId = await GameRepository.createGame(
      gameName,
      gameType,
      rulesets,
      expansions,
      playset,
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

  public static async getGameInviteKey(gameId: string): Promise<string> {
    return GameInviteKeyRepository.getGameInviteKey(gameId);
  }

  public static async getGameInviteInfo(inviteKey: string): Promise<
    | {
      name: string;
      gameType: GameType;
    }
    | { gameId: string }
  > {
    const result = await GameInviteKeyRepository.getGameInfoFromInviteKey(
      inviteKey,
    );

    if ("gameId" in result) {
      return {
        gameId: result.gameId,
      };
    }
    let gameType: GameType = GameType.Solo;
    if (result.gameType === "co-op") {
      gameType = GameType.Coop;
    } else if (result.gameType === "guided") {
      gameType = GameType.Guided;
    }

    return {
      name: result.gameName,
      gameType,
    };
  }

  public static listenToGame(
    gameId: string,
    onUpdate: (game: IGame) => void,
    onError: (error: Error) => void,
  ): () => void {
    return GameRepository.listenToGame(
      gameId,
      (gameDTO) => {
        onUpdate(this.convertGameDTOToGame(gameDTO));
      },
      onError,
    );
  }
  public static listenToGamePlayers(
    gameId: string,
    onGamePlayers: (
      gamePlayers: Record<string, IGamePlayer>,
      removed: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return GamePlayersRepository.listenToGamePlayers(
      gameId,
      (gamePlayersDTO, removed, replaceState) => {
        onGamePlayers(
          Object.fromEntries(
            Object.entries(gamePlayersDTO).map(([key, value]) => [
              key,
              this.convertGamePlayerDTOToGamePlayer(value),
            ]),
          ),
          removed,
          replaceState,
        );
      },
      onError,
    );
  }

  public static async getUsersGames(
    uid: string,
  ): Promise<Record<string, IGame>> {
    const games = await GameRepository.getUsersGames(uid);
    return Object.fromEntries(
      games.map((gameDTO) => [gameDTO.id, this.convertGameDTOToGame(gameDTO)]),
    );
  }

  public static async changeName(
    gameId: string,
    newName: string,
  ): Promise<void> {
    await GameRepository.updateGame(gameId, { name: newName });
  }

  public static async addPlayer(
    inviteKey: string,
    playerId: string,
  ): Promise<string> {
    return GameInviteKeyRepository.addPlayerToGameFromInviteKey(
      inviteKey,
      playerId,
    );
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
    await GameRepository.updateGame(gameId, {
      condition_meter_values: updatedConditionMeters,
    });
  }

  public static async updateSpecialTracks(
    gameId: string,
    specialTracks: Record<string, SpecialTrack>,
  ): Promise<void> {
    await GameRepository.updateGame(gameId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      special_track_values: specialTracks as unknown as any,
    });
  }

  public static async changeGameType(gameId: string, gameType: GameType) {
    const role = this.getDefaultPlayerRoleForGameType(gameType);
    await GamePlayersRepository.updateAllGamePlayerRoles(gameId, role);
    await GameRepository.updateGame(gameId, { game_type: gameType });
  }

  public static async updateRules(
    gameId: string,
    rulesets: RulesetConfig,
    expansions: ExpansionConfig,
    playset: PlaysetConfig,
  ): Promise<void> {
    await GameRepository.updateGame(gameId, { rulesets, expansions, playset });
  }

  public static async updateColorScheme(
    gameId: string,
    colorScheme: ColorScheme,
  ) {
    await GameRepository.updateGame(gameId, { color_scheme: colorScheme });
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
      playset: gameDTO.playset as PlaysetConfig,
    };
  }

  public static deleteGame(gameId: string): Promise<void> {
    return GameRepository.deleteGame(gameId);
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
  private static convertGamePlayerDTOToGamePlayer(
    dto: GamePlayerDTO,
  ): IGamePlayer {
    const role: GamePlayerRole = dto.role === "guide"
      ? GamePlayerRole.Guide
      : GamePlayerRole.Player;
    return {
      role,
      created_at: dto.created_at,
      game_id: dto.game_id,
      user_id: dto.user_id,
    };
  }
}
