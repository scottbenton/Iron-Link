import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldPlayerDTO,
  WorldPlayersRepository,
} from "repositories/worldPlayers.repository";

// Explicit membership roles stored in world_players. Game members get
// live-derived guide/player access without a membership row (see
// WorldPermission); these roles only exist as explicit rows.
export enum WorldPlayerRole {
  Owner = "owner",
  Editor = "editor",
  Viewer = "viewer",
}

export interface IWorldPlayer {
  worldId: string;
  userId: string;
  role: WorldPlayerRole;
  createdAt: Date;
}

export class WorldPlayersService {
  public static listenToWorldPlayers(
    worldId: string,
    onWorldPlayerChanges: (
      changedWorldPlayers: Record<string, IWorldPlayer>,
      removedWorldPlayerIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldPlayersRepository.listenToWorldPlayers(
      worldId,
      (changedPlayers, removedPlayerIds, replaceState) =>
        onWorldPlayerChanges(
          Object.fromEntries(
            Object.entries(changedPlayers).map(([userId, player]) => [
              userId,
              this.convertWorldPlayerDTOToWorldPlayer(player),
            ]),
          ),
          removedPlayerIds,
          replaceState,
        ),
      onError,
    );
  }

  public static addWorldPlayer(
    worldId: string,
    userId: string,
    role: WorldPlayerRole,
  ): Promise<void> {
    return WorldPlayersRepository.addWorldPlayer(worldId, userId, role);
  }

  public static updateWorldPlayerRole(
    worldId: string,
    userId: string,
    role: WorldPlayerRole,
  ): Promise<void> {
    return WorldPlayersRepository.updateWorldPlayerRole(worldId, userId, role);
  }

  public static removeWorldPlayer(
    worldId: string,
    userId: string,
  ): Promise<void> {
    return WorldPlayersRepository.removeWorldPlayer(worldId, userId);
  }

  private static convertWorldPlayerDTOToWorldPlayer(
    player: WorldPlayerDTO,
  ): IWorldPlayer {
    let role: WorldPlayerRole;
    switch (player.role) {
      case "owner":
        role = WorldPlayerRole.Owner;
        break;
      case "editor":
        role = WorldPlayerRole.Editor;
        break;
      default:
        role = WorldPlayerRole.Viewer;
    }
    return {
      worldId: player.world_id,
      userId: player.user_id,
      role,
      createdAt: new Date(player.created_at),
    };
  }
}
