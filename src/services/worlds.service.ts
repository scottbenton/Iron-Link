import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { WorldPermission } from "repositories/shared.types";
import { WorldDTO, WorldsRepository } from "repositories/worlds.repository";

export interface IWorld {
  id: string;
  name: string;
  description: string | null;
  // Package-qualified setting key ("<packageId>/<settingKey>") chosen at
  // creation; drives truths seeding and the binding picker's default scope.
  settingKey: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorldsService {
  public static async getWorld(worldId: string): Promise<IWorld> {
    const world = await WorldsRepository.getWorld(worldId);
    return this.convertWorldDTOToWorld(world);
  }

  public static listenToWorld(
    worldId: string,
    onWorld: (world: IWorld) => void,
    onWorldDeleted: () => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldsRepository.listenToWorld(
      worldId,
      (world) => onWorld(this.convertWorldDTOToWorld(world)),
      onWorldDeleted,
      onError,
    );
  }

  public static async getUsersWorlds(): Promise<Record<string, IWorld>> {
    const worlds = await WorldsRepository.getUsersWorlds();
    return Object.fromEntries(
      worlds.map((world) => [world.id, this.convertWorldDTOToWorld(world)]),
    );
  }

  public static createWorld(
    name: string,
    description?: string,
    settingKey?: string,
  ): Promise<string> {
    return WorldsRepository.createWorld(
      name,
      description ?? null,
      settingKey ?? null,
    );
  }

  public static updateWorldName(worldId: string, name: string): Promise<void> {
    return WorldsRepository.updateWorld(worldId, { name });
  }

  public static updateWorldDescription(
    worldId: string,
    description: string | null,
  ): Promise<void> {
    return WorldsRepository.updateWorld(worldId, { description });
  }

  public static deleteWorld(worldId: string): Promise<void> {
    return WorldsRepository.deleteWorld(worldId);
  }

  public static getWorldPermission(
    worldId: string,
    userId: string,
  ): Promise<WorldPermission> {
    return WorldsRepository.getWorldPermission(worldId, userId);
  }

  private static convertWorldDTOToWorld(world: WorldDTO): IWorld {
    return {
      id: world.id,
      name: world.name,
      description: world.description,
      settingKey: world.setting_key,
      createdBy: world.created_by,
      createdAt: new Date(world.created_at),
      updatedAt: new Date(world.updated_at),
    };
  }
}
