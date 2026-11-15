import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { Difficulty } from "repositories/tracks.repository";
import {
  WorldEntryBondDTO,
  WorldEntryBondKey,
  WorldEntryBondsRepository,
  WorldEntryConnectionDTO,
} from "repositories/worldEntryBonds.repository";

// An Ironlands bond is only the link. A Starforged connection is its own
// record, one character's or shared by allies; a character's bond row of
// kind "connection" says it shares one.
export type WorldEntryBondKind = "bond" | "connection";

export interface IWorldEntryBond {
  entryId: string;
  characterId: string;
  worldId: string;
  kind: WorldEntryBondKind;
  // The connection the character shares, for kind "connection".
  connectionId: string | null;
}

export interface IWorldEntryConnection {
  id: string;
  entryId: string;
  gameId: string;
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
  Pick<IWorldEntryConnection, "rank" | "ticks" | "bonded">
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
        kind: "bond",
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

  // Makes a connection for one character and returns it with the character's
  // membership.
  public static async addConnection(
    key: IWorldEntryBondKey,
    rank: Difficulty,
  ): Promise<{ connection: IWorldEntryConnection; bond: IWorldEntryBond }> {
    const connection = this.convertConnection(
      await WorldEntryBondsRepository.createConnection(
        key.entryId,
        key.characterId,
        rank,
      ),
    );
    return {
      connection,
      bond: {
        ...key,
        worldId: connection.worldId,
        kind: "connection",
        connectionId: connection.id,
      },
    };
  }

  // Adds a character to a connection another character made.
  public static async shareConnection(
    key: IWorldEntryBondKey,
    connectionId: string,
  ): Promise<IWorldEntryBond> {
    return this.convert(
      await WorldEntryBondsRepository.createBond({
        entry_id: key.entryId,
        character_id: key.characterId,
        kind: "connection",
        connection_id: connectionId,
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
      }),
    );
  }

  // Removes a bond, or takes a character out of a connection (the last
  // member leaving removes the connection).
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
    const kind: WorldEntryBondKind =
      bond.kind === "connection" ? "connection" : "bond";
    return {
      entryId: bond.entry_id,
      characterId: bond.character_id,
      worldId: bond.world_id,
      kind,
      connectionId: kind === "connection" ? bond.connection_id : null,
    };
  }

  private static convertConnection(
    connection: WorldEntryConnectionDTO,
  ): IWorldEntryConnection {
    return {
      id: connection.id,
      entryId: connection.entry_id,
      gameId: connection.game_id,
      worldId: connection.world_id,
      rank: connection.rank as Difficulty,
      ticks: connection.completed_ticks,
      bonded: connection.bonded,
    };
  }
}
