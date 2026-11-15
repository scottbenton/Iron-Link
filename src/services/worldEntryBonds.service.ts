import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { Difficulty } from "repositories/tracks.repository";
import {
  WorldEntryBondDTO,
  WorldEntryBondKey,
  WorldEntryBondsRepository,
} from "repositories/worldEntryBonds.repository";

// An Ironlands bond is only the link. A Starforged connection has a rank, a
// progress track and whether it has become a bond.
export type WorldEntryBondKind = "bond" | "connection";

export interface IWorldEntryBond {
  entryId: string;
  characterId: string;
  worldId: string;
  kind: WorldEntryBondKind;
  rank: Difficulty | null;
  // 0 to 40, four ticks a box.
  ticks: number;
  bonded: boolean;
}

export interface IWorldEntryBondKey {
  entryId: string;
  characterId: string;
}

export type IWorldConnectionUpdate = Partial<
  Pick<IWorldEntryBond, "rank" | "ticks" | "bonded">
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

  public static async addConnection(
    key: IWorldEntryBondKey,
    rank: Difficulty,
  ): Promise<IWorldEntryBond> {
    return this.convert(
      await WorldEntryBondsRepository.createBond({
        entry_id: key.entryId,
        character_id: key.characterId,
        kind: "connection",
        rank,
      }),
    );
  }

  public static async updateConnection(
    key: IWorldEntryBondKey,
    update: IWorldConnectionUpdate,
  ): Promise<IWorldEntryBond> {
    return this.convert(
      await WorldEntryBondsRepository.updateBond(
        { entry_id: key.entryId, character_id: key.characterId },
        {
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
        },
      ),
    );
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
    const kind: WorldEntryBondKind =
      bond.kind === "connection" ? "connection" : "bond";
    return {
      entryId: bond.entry_id,
      characterId: bond.character_id,
      worldId: bond.world_id,
      kind,
      rank: kind === "connection" ? ((bond.rank as Difficulty) ?? null) : null,
      ticks: bond.completed_ticks,
      bonded: bond.bonded,
    };
  }
}
