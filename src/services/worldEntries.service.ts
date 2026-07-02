import { Buffer } from "buffer";

import { IconDefinition } from "types/Icon.type";
import {
  LocationMap,
  MapBackgroundImageFit,
  MapStrokeColors,
} from "types/Locations.type";
import { Json } from "types/supabase-generated.type";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";
import { StorageRepository } from "repositories/storage.repository";
import {
  WorldEntriesRepository,
  WorldEntryDTO,
} from "repositories/worldEntries.repository";

// Values for text/richText/oracleText fields are strings; tags fields store
// string arrays. Image fields store filenames in image_filenames instead.
export type WorldEntryFieldValue = string | string[];

export interface IWorldEntryMapSettings {
  backgroundImageFit: MapBackgroundImageFit;
  strokeColor: MapStrokeColors;
  showMap: boolean;
}

export interface IWorldEntry {
  id: string;
  worldId: string;
  categoryId: string;
  parentEntryId: string | null;
  name: string;
  icon: IconDefinition | null;
  imageFilenames: string[];
  fields: Record<string, WorldEntryFieldValue>;
  map: LocationMap | null;
  mapBackgroundFilename: string | null;
  mapSettings: IWorldEntryMapSettings | null;
  readPermissions: ReadPermissions;
  editPermissions: EditPermissions;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorldEntryNotesContent {
  content: Uint8Array;
}

export class WorldEntriesService {
  public static listenToWorldEntries(
    uid: string | undefined,
    worldId: string,
    permission: WorldPermission,
    onWorldEntryChanges: (
      changedEntries: Record<string, IWorldEntry>,
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntriesRepository.listenToWorldEntries(
      uid,
      worldId,
      permission,
      (changedEntries, removedEntryIds, replaceState) =>
        onWorldEntryChanges(
          Object.fromEntries(
            Object.entries(changedEntries).map(([entryId, entry]) => [
              entryId,
              this.convertWorldEntryDTOToWorldEntry(entry),
            ]),
          ),
          removedEntryIds,
          replaceState,
        ),
      onError,
    );
  }

  public static addWorldEntry(
    uid: string,
    worldId: string,
    categoryId: string,
    name: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
    parentEntryId?: string,
  ): Promise<string> {
    return WorldEntriesRepository.addWorldEntry({
      world_id: worldId,
      category_id: categoryId,
      parent_entry_id: parentEntryId ?? null,
      name,
      author_id: uid,
      read_permissions: readPermissions,
      edit_permissions: editPermissions,
    });
  }

  public static updateWorldEntry(
    entryId: string,
    entry: Partial<
      Omit<
        IWorldEntry,
        "id" | "worldId" | "authorId" | "createdAt" | "updatedAt"
      >
    >,
  ): Promise<void> {
    return WorldEntriesRepository.updateWorldEntry(entryId, {
      category_id: entry.categoryId,
      parent_entry_id: entry.parentEntryId,
      name: entry.name,
      icon:
        entry.icon === undefined ? undefined : (entry.icon as unknown as Json),
      image_filenames: entry.imageFilenames,
      fields:
        entry.fields === undefined
          ? undefined
          : (entry.fields as unknown as Json),
      map: entry.map === undefined ? undefined : (entry.map as unknown as Json),
      map_background_filename: entry.mapBackgroundFilename,
      map_settings:
        entry.mapSettings === undefined
          ? undefined
          : (entry.mapSettings as unknown as Json),
      read_permissions: entry.readPermissions,
      edit_permissions: entry.editPermissions,
    });
  }

  public static updateWorldEntryNotesContent(
    entryId: string,
    content: Uint8Array,
  ): Promise<void> {
    return WorldEntriesRepository.updateWorldEntry(entryId, {
      notes_content: this.uint8ArrayToDatabase(content),
    });
  }

  public static updateWorldEntryNotesContentBeacon(
    entryId: string,
    content: Uint8Array,
    token: string,
  ): Promise<void> {
    return WorldEntriesRepository.updateWorldEntryBeaconRequest(
      token,
      entryId,
      {
        notes_content: this.uint8ArrayToDatabase(content),
      },
    );
  }

  public static async getWorldEntryNotesContent(
    entryId: string,
  ): Promise<IWorldEntryNotesContent> {
    const entry =
      await WorldEntriesRepository.getWorldEntryNotesContent(entryId);
    return {
      content: entry.notes_content
        ? this.databaseToUint8Array(entry.notes_content)
        : new Uint8Array(),
    };
  }

  public static deleteWorldEntry(entryId: string): Promise<void> {
    return WorldEntriesRepository.deleteWorldEntry(entryId);
  }

  // Both world buckets use the <worldId>/<entryId>/<filename> convention;
  // storage policies check world_role() against the first path segment.
  public static uploadWorldEntryImage(
    worldId: string,
    entryId: string,
    image: File,
  ): Promise<{ filename: string; url: string }> {
    const filename = `${new Date().getTime()}_${image.name}`;
    const renamedImage = StorageRepository.renameFile(image, filename);
    return StorageRepository.storeImage(
      "world_entry_images",
      `${worldId}/${entryId}`,
      renamedImage,
    ).then((url) => ({ filename, url }));
  }

  public static deleteWorldEntryImage(
    worldId: string,
    entryId: string,
    filename: string,
  ): Promise<void> {
    return StorageRepository.deleteImage(
      "world_entry_images",
      `${worldId}/${entryId}`,
      filename,
    );
  }

  public static getWorldEntryImageUrl(
    worldId: string,
    entryId: string,
    filename: string,
  ): string {
    return StorageRepository.getImageUrl(
      "world_entry_images",
      `${worldId}/${entryId}`,
      filename,
    );
  }

  public static uploadWorldMapBackground(
    worldId: string,
    entryId: string,
    image: File,
  ): Promise<{ filename: string; url: string }> {
    const filename = `${new Date().getTime()}_${image.name}`;
    const renamedImage = StorageRepository.renameFile(image, filename);
    return StorageRepository.storeImage(
      "world_map_backgrounds",
      `${worldId}/${entryId}`,
      renamedImage,
    ).then((url) => ({ filename, url }));
  }

  public static deleteWorldMapBackground(
    worldId: string,
    entryId: string,
    filename: string,
  ): Promise<void> {
    return StorageRepository.deleteImage(
      "world_map_backgrounds",
      `${worldId}/${entryId}`,
      filename,
    );
  }

  public static getWorldMapBackgroundUrl(
    worldId: string,
    entryId: string,
    filename: string,
  ): string {
    return StorageRepository.getImageUrl(
      "world_map_backgrounds",
      `${worldId}/${entryId}`,
      filename,
    );
  }

  private static convertWorldEntryDTOToWorldEntry(
    entry: WorldEntryDTO,
  ): IWorldEntry {
    let readPermissions: ReadPermissions;
    switch (entry.read_permissions) {
      case "only_author":
        readPermissions = ReadPermissions.OnlyAuthor;
        break;
      case "only_guides":
        readPermissions = ReadPermissions.OnlyGuides;
        break;
      case "all_players":
        readPermissions = ReadPermissions.AllPlayers;
        break;
      case "guides_and_author":
        readPermissions = ReadPermissions.GuidesAndAuthor;
        break;
      case "public":
        readPermissions = ReadPermissions.Public;
        break;
      default:
        readPermissions = ReadPermissions.OnlyAuthor;
    }
    let editPermissions: EditPermissions;
    switch (entry.edit_permissions) {
      case "only_author":
        editPermissions = EditPermissions.OnlyAuthor;
        break;
      case "only_guides":
        editPermissions = EditPermissions.OnlyGuides;
        break;
      case "guides_and_author":
        editPermissions = EditPermissions.GuidesAndAuthor;
        break;
      case "all_players":
        editPermissions = EditPermissions.AllPlayers;
        break;
      default:
        editPermissions = EditPermissions.OnlyAuthor;
    }

    return {
      id: entry.id,
      worldId: entry.world_id,
      categoryId: entry.category_id,
      parentEntryId: entry.parent_entry_id,
      name: entry.name,
      icon: (entry.icon as unknown as IconDefinition) ?? null,
      imageFilenames: entry.image_filenames ?? [],
      fields:
        entry.fields && typeof entry.fields === "object"
          ? (entry.fields as Record<string, WorldEntryFieldValue>)
          : {},
      map: (entry.map as unknown as LocationMap) ?? null,
      mapBackgroundFilename: entry.map_background_filename,
      mapSettings:
        (entry.map_settings as unknown as IWorldEntryMapSettings) ?? null,
      readPermissions,
      editPermissions,
      authorId: entry.author_id,
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at),
    };
  }

  private static uint8ArrayToDatabase(arr: Uint8Array): string {
    return "\\x" + Buffer.from(arr).toString("hex");
  }
  private static databaseToUint8Array(str: string): Uint8Array {
    return Buffer.from(str.slice(2), "hex");
  }
}
