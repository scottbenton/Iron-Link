import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";
import { WorldPlayersRepository } from "repositories/worldPlayers.repository";
import { WorldDTO, WorldsRepository } from "repositories/worlds.repository";

export enum WorldPlayerRole {
  Viewer = "viewer",
  Player = "player",
  Guide = "guide",
  Owner = "owner",
}

export interface IWorld {
  id: string;
  name: string;
  // truths // TODO

  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
  playset: PlaysetConfig;
  settingsPackageId: string | null;
}

export class WorldsService {
  public static async createWorld(
    uid: string,
    name: string,
    rulesets: RulesetConfig,
    expansions: ExpansionConfig,
    playset: PlaysetConfig,
    settingsPackageId: string | null,
  ): Promise<string> {
    const worldId = await WorldsRepository.createWorld({
      name,
      rulesets,
      expansions,
      playset,
      setting_package_id: settingsPackageId,
    });

    WorldPlayersRepository.addWorldPlayer({
      world_id: worldId,
      user_id: uid,
      role: WorldPlayerRole.Owner,
    });

    return worldId;
  }

  public static async listenToWorld(
    worldId: string,
    onWorldUpdate: (world: IWorld | null) => void,
    onError: (error: RepositoryError) => void,
  ) {
    return WorldsRepository.listenToWorld(
      worldId,
      (world) => {
        if (world) {
          onWorldUpdate(this.convertWorldDTOToIWorld(world));
        } else {
          onWorldUpdate(null);
        }
      },
      onError,
    );
  }

  public static async getUsersWorlds(
    uid: string,
    role?: "guide" | "player" | "owner",
  ): Promise<IWorld[]> {
    const worlds = await WorldsRepository.getUsersWorlds(uid, role);
    return worlds.map(this.convertWorldDTOToIWorld);
  }

  private static convertWorldDTOToIWorld(world: WorldDTO): IWorld {
    return {
      id: world.id,
      name: world.name,
      rulesets: world.rulesets as RulesetConfig,
      expansions: world.expansions as ExpansionConfig,
      playset: world.playset as PlaysetConfig,
      settingsPackageId: world.setting_package_id,
    };
  }
}
