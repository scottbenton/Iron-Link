import { Json } from "types/supabase-generated.type";

import {
  WorldMapCell,
  WorldMapChunk,
  isWorldMapCell,
} from "lib/worldMap/chunks";
import { WorldMapGrid } from "lib/worldMap/grid";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldMapChunkDTO,
  WorldMapDTO,
  WorldMapPinDTO,
  WorldMapsRepository,
} from "repositories/worldMaps.repository";

import { WorldEntriesService } from "./worldEntries.service";

export interface IWorldMapBackground {
  filename: string;
  // Top left corner and width in map units; the height follows the image.
  x: number;
  y: number;
  width: number | null;
}

export interface IWorldMap {
  entryId: string;
  worldId: string;
  grid: WorldMapGrid;
  hexFlowers: boolean;
  background: IWorldMapBackground | null;
}

export interface IWorldMapPin {
  entryId: string;
  mapEntryId: string;
  x: number;
  y: number;
}

export type IWorldMapUpdate = Partial<
  Pick<IWorldMap, "grid" | "hexFlowers" | "background">
>;

const GRIDS: WorldMapGrid[] = ["hex_pointy", "hex_flat", "square", "none"];

export class WorldMapsService {
  public static listenToWorldMap(
    entryId: string,
    onMap: (map: IWorldMap | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldMapsRepository.listenToWorldMap(
      entryId,
      (map) => onMap(map ? this.convertMap(map) : null),
      onError,
    );
  }

  public static listenToWorldMapChunks(
    entryId: string,
    onChunks: (chunks: WorldMapChunk[], replaceState: boolean) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldMapsRepository.listenToWorldMapChunks(
      entryId,
      (chunks, replaceState) =>
        onChunks(chunks.map(this.convertChunk), replaceState),
      onError,
    );
  }

  public static listenToWorldMapPins(
    entryId: string,
    onPins: (
      changed: IWorldMapPin[],
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldMapsRepository.listenToWorldMapPins(
      entryId,
      (changed, removed, replaceState) =>
        onPins(changed.map(this.convertPin), removed, replaceState),
      onError,
    );
  }

  public static createWorldMap(
    worldId: string,
    entryId: string,
    grid: WorldMapGrid,
  ): Promise<IWorldMap> {
    return WorldMapsRepository.createWorldMap({
      entry_id: entryId,
      world_id: worldId,
      grid,
    }).then((map) => this.convertMap(map));
  }

  public static updateWorldMap(
    entryId: string,
    update: IWorldMapUpdate,
  ): Promise<IWorldMap> {
    return WorldMapsRepository.updateWorldMap(entryId, {
      grid: update.grid,
      hex_flowers: update.hexFlowers,
      ...(update.background === undefined
        ? {}
        : update.background === null
          ? { background_filename: null, background_width: null }
          : {
              background_filename: update.background.filename,
              background_x: update.background.x,
              background_y: update.background.y,
              background_width: update.background.width,
            }),
    }).then((map) => this.convertMap(map));
  }

  public static paintCells(
    entryId: string,
    cells: Record<string, WorldMapCell | null>,
  ): Promise<WorldMapChunk[]> {
    return WorldMapsRepository.paintCells(
      entryId,
      cells as unknown as Record<string, Json>,
    ).then((chunks) => chunks.map(this.convertChunk));
  }

  public static clearCells(entryId: string): Promise<WorldMapChunk[]> {
    return WorldMapsRepository.clearCells(entryId).then((chunks) =>
      chunks.map(this.convertChunk),
    );
  }

  public static setPin(pin: IWorldMapPin): Promise<void> {
    return WorldMapsRepository.setPin({
      pinned_entry_id: pin.entryId,
      entry_id: pin.mapEntryId,
      x: pin.x,
      y: pin.y,
    });
  }

  public static removePin(pinnedEntryId: string): Promise<void> {
    return WorldMapsRepository.removePin(pinnedEntryId);
  }

  public static getBackgroundUrl(map: IWorldMap): string | null {
    if (!map.background) return null;
    return WorldEntriesService.getWorldMapBackgroundUrl(
      map.worldId,
      map.entryId,
      map.background.filename,
    );
  }

  private static convertMap(map: WorldMapDTO): IWorldMap {
    return {
      entryId: map.entry_id,
      worldId: map.world_id,
      grid: GRIDS.includes(map.grid as WorldMapGrid)
        ? (map.grid as WorldMapGrid)
        : "none",
      hexFlowers: map.hex_flowers,
      background: map.background_filename
        ? {
            filename: map.background_filename,
            x: map.background_x,
            y: map.background_y,
            width: map.background_width,
          }
        : null,
    };
  }

  // Cells this build cannot read are left out rather than breaking the map.
  private static convertChunk(chunk: WorldMapChunkDTO): WorldMapChunk {
    const cells: Record<string, WorldMapCell> = {};
    if (chunk.cells && typeof chunk.cells === "object") {
      Object.entries(chunk.cells).forEach(([key, cell]) => {
        if (isWorldMapCell(cell)) cells[key] = cell;
      });
    }
    return {
      x: chunk.chunk_x,
      y: chunk.chunk_y,
      cells,
      version: chunk.version,
    };
  }

  private static convertPin(pin: WorldMapPinDTO): IWorldMapPin {
    return {
      entryId: pin.pinned_entry_id,
      mapEntryId: pin.entry_id,
      x: pin.x,
      y: pin.y,
    };
  }
}
