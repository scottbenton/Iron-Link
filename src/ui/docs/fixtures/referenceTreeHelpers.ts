import type { Datasworn } from "@datasworn-community/core";

export interface LooseOracleCollection {
  _id: string;
  name: string;
  oracle_type: string;
  contents?: Record<string, { _id: string; name: string }>;
  collections?: Record<string, LooseOracleCollection>;
}

export interface LooseMoveCategory {
  _id?: string;
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
  collections?: Record<string, LooseMoveCategory>;
}

export const isSharedRoll = (collection: LooseOracleCollection) =>
  collection.oracle_type !== "tables";

/** Every oracle a collection rolls, its sub-collections included. */
export function countOracles(collection: LooseOracleCollection): number {
  if (isSharedRoll(collection)) return 1;
  return (
    Object.keys(collection.contents ?? {}).length +
    Object.values(collection.collections ?? {}).reduce(
      (total, child) => total + countOracles(child),
      0,
    )
  );
}

export const oracleCountLabel = (count: number) =>
  count === 1 ? "1 oracle" : `${count} oracles`;
export const moveCountLabel = (count: number) =>
  count === 1 ? "1 move" : `${count} moves`;

export interface TreeOpenOptions {
  /** Every category starts open (true) or closed (false). */
  defaultOpen?: boolean;
  /** Only these collection ids start open; wins over `defaultOpen`. */
  openIds?: ReadonlySet<string>;
}

export const startsOpen = (id: string | undefined, options: TreeOpenOptions) =>
  options.openIds ? !!id && options.openIds.has(id) : !!options.defaultOpen;
