import { byteaToUint8Array } from "lib/bytea.lib";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { WorldPermission } from "repositories/shared.types";
import { StorageRepository } from "repositories/storage.repository";
import {
  WorldDTO,
  WorldLinkResult,
  WorldMembershipRole,
  WorldsRepository,
} from "repositories/worlds.repository";

import {
  RichTextContentService,
  RichTextContentStore,
} from "./richTextContent.service";

const WORLD_NOTES_IMAGE_FOLDER = "world-notes";

export interface IWorld {
  id: string;
  name: string;
  // The setting chosen at creation; drives truths seeding and the binding
  // picker's default scope. Either a datasworn world id
  // ("world:starforged/forge"), or a bare package id when the package ships
  // truths but no worlds, or null for a blank world.
  settingKey: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// A world as it appears in the user's world list: the world plus how they
// reach it. `role` is null when the only path is a linked game, which is
// enough to render the list read-only without a per-world permission call.
export interface IUsersWorld extends IWorld {
  role: WorldMembershipRole | null;
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

  public static async getUsersWorlds(
    userId: string,
  ): Promise<Record<string, IUsersWorld>> {
    const worlds = await WorldsRepository.getUsersWorlds(userId);
    return Object.fromEntries(
      worlds.map(({ world, role }) => [
        world.id,
        { ...this.convertWorldDTOToWorld(world), role },
      ]),
    );
  }

  public static createWorld(
    name: string,
    settingKey?: string,
  ): Promise<string> {
    return WorldsRepository.createWorld(name, settingKey ?? null);
  }

  public static updateWorldName(worldId: string, name: string): Promise<void> {
    return WorldsRepository.updateWorld(worldId, { name });
  }

  // A world's Notes as Yjs bytes, empty while nobody has written any.
  public static async getWorldNotesContent(
    worldId: string,
  ): Promise<Uint8Array> {
    const content = await WorldsRepository.getWorldNotesContent(worldId);
    return content ? byteaToUint8Array(content) : new Uint8Array();
  }

  public static getWorldNotesContentStore(
    worldId: string,
    getToken: () => string | undefined,
  ): RichTextContentStore {
    return RichTextContentService.createStore(
      { table: "worlds", column: "notes_content" },
      worldId,
      getToken,
    );
  }

  // World Notes images share the entry images bucket, whose policies check
  // the world in the path's first segment, under a folder of their own.
  public static uploadWorldNotesImage(
    worldId: string,
    image: File,
  ): Promise<string> {
    const filename = `${new Date().getTime()}_${image.name}`;
    return StorageRepository.storeImage(
      "world_entry_images",
      `${worldId}/${WORLD_NOTES_IMAGE_FOLDER}`,
      StorageRepository.renameFile(image, filename),
    );
  }

  // Both sides of the game<->world link. The game store already listens to
  // its games row, so callers do not need to update any local state -- the
  // new world_id arrives over realtime.
  public static linkGameToWorld(
    gameId: string,
    worldId: string,
  ): Promise<WorldLinkResult> {
    return WorldsRepository.linkGameToWorld(gameId, worldId);
  }

  public static unlinkGameFromWorld(gameId: string): Promise<void> {
    return WorldsRepository.unlinkGameFromWorld(gameId);
  }

  public static countGamesLinkedToWorld(worldId: string): Promise<number> {
    return WorldsRepository.countGamesLinkedToWorld(worldId);
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

  public static getWorldIsGuided(worldId: string): Promise<boolean> {
    return WorldsRepository.getWorldIsGuided(worldId);
  }

  private static convertWorldDTOToWorld(world: WorldDTO): IWorld {
    return {
      id: world.id,
      name: world.name,
      settingKey: world.setting_key,
      createdBy: world.created_by,
      createdAt: new Date(world.created_at),
      updatedAt: new Date(world.updated_at),
    };
  }
}
