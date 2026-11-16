import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { Difficulty } from "repositories/tracks.repository";
import {
  WorldEntryBondDTO,
  WorldEntryBondKey,
  WorldEntryBondsRepository,
  WorldEntryConnectionDTO,
} from "repositories/worldEntryBonds.repository";

// An Ironlands bond is only the link between a character and an entry.
export interface IWorldEntryBond {
  entryId: string;
  characterId: string;
  worldId: string;
}

// A Starforged connection: one character's, or the whole party's.
export interface IWorldEntryConnection {
  id: string;
  entryId: string;
  gameId: string;
  // Null when every character of the game shares it.
  characterId: string | null;
  worldId: string;
  rank: Difficulty;
  // 0 to 40, four ticks a box.
  ticks: number;
  bonded: boolean;
}

export interface IWorldEntryBondKey {
  entryId: string;
  characterId: string;
}

export type IWorldConnectionUpdate = Partial<
  Pick<IWorldEntryConnection, "rank" | "ticks" | "bonded" | "characterId">
>;

export type IWorldConnectionNew = Pick<
  IWorldEntryConnection,
  "entryId" | "gameId" | "characterId" | "rank"
>;

export const MAX_CONNECTION_TICKS = 40;

export function getWorldEntryBondKey(bond: IWorldEntryBondKey): string {
  return `${bond.entryId}:${bond.characterId}`;
}

export class WorldEntryBondsService {
  public static listenToEntryBonds(
    entryId: string,
    onBonds: (
      changed: IWorldEntryBond[],
      removed: IWorldEntryBondKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryBondsRepository.listenToEntryBonds(
      entryId,
      (changed, removed, replace) =>
        onBonds(
          changed.map(this.convert),
          removed.map(this.convertKey),
          replace,
        ),
      onError,
    );
  }

  public static listenToCharacterBonds(
    characterId: string,
    onBonds: (
      changed: IWorldEntryBond[],
      removed: IWorldEntryBondKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryBondsRepository.listenToCharacterBonds(
      characterId,
      (changed, removed, replace) =>
        onBonds(
          changed.map(this.convert),
          removed.map(this.convertKey),
          replace,
        ),
      onError,
    );
  }

  public static async addBond(
    key: IWorldEntryBondKey,
  ): Promise<IWorldEntryBond> {
    return this.convert(
      await WorldEntryBondsRepository.createBond({
        entry_id: key.entryId,
        character_id: key.characterId,
      }),
    );
  }

  public static listenToGameConnections(
    gameId: string,
    onConnections: (
      changed: IWorldEntryConnection[],
      removedIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldEntryBondsRepository.listenToGameConnections(
      gameId,
      (changed, removedIds, replace) =>
        onConnections(changed.map(this.convertConnection), removedIds, replace),
      onError,
    );
  }

  public static async addConnection(
    connection: IWorldConnectionNew,
  ): Promise<IWorldEntryConnection> {
    return this.convertConnection(
      await WorldEntryBondsRepository.createConnection({
        entry_id: connection.entryId,
        game_id: connection.gameId,
        character_id: connection.characterId,
        rank: connection.rank,
      }),
    );
  }

  public static async updateConnection(
    connectionId: string,
    update: IWorldConnectionUpdate,
  ): Promise<IWorldEntryConnection> {
    return this.convertConnection(
      await WorldEntryBondsRepository.updateConnection(connectionId, {
        ...(update.rank !== undefined ? { rank: update.rank } : {}),
        ...(update.ticks !== undefined
          ? {
              completed_ticks: Math.max(
                0,
                Math.min(MAX_CONNECTION_TICKS, Math.round(update.ticks)),
              ),
            }
          : {}),
        ...(update.bonded !== undefined ? { bonded: update.bonded } : {}),
        ...(update.characterId !== undefined
          ? { character_id: update.characterId }
          : {}),
      }),
    );
  }

  public static removeConnection(connectionId: string): Promise<void> {
    return WorldEntryBondsRepository.deleteConnection(connectionId);
  }

  public static removeBond(key: IWorldEntryBondKey): Promise<void> {
    return WorldEntryBondsRepository.deleteBond({
      entry_id: key.entryId,
      character_id: key.characterId,
    });
  }

  private static convertKey(key: WorldEntryBondKey): IWorldEntryBondKey {
    return { entryId: key.entry_id, characterId: key.character_id };
  }

  private static convert(bond: WorldEntryBondDTO): IWorldEntryBond {
    return {
      entryId: bond.entry_id,
      characterId: bond.character_id,
      worldId: bond.world_id,
    };
  }

  private static convertConnection(
    connection: WorldEntryConnectionDTO,
  ): IWorldEntryConnection {
    return {
      id: connection.id,
      entryId: connection.entry_id,
      gameId: connection.game_id,
      characterId: connection.character_id,
      worldId: connection.world_id,
      rank: connection.rank as Difficulty,
      ticks: connection.completed_ticks,
      bonded: connection.bonded,
    };
  }
}
