import { describe, expect, it } from "vitest";

import { CountableCollection, countVisibleItems } from "../countVisibleItems";
import {
  CollectionVisibility,
  ItemVisibility,
} from "../getCollectionVisibility";

const subCollection: CountableCollection = {
  _id: "sub",
  contents: { c: { _id: "c" }, d: { _id: "d" } },
};
const shared: CountableCollection = {
  _id: "shared",
  oracle_type: "table_shared_text",
  contents: { e: { _id: "e" }, f: { _id: "f" } },
};
const root: CountableCollection = {
  _id: "root",
  contents: { a: { _id: "a" }, b: { _id: "b" } },
  collections: { sub: subCollection, shared },
};
const map = { root, sub: subCollection, shared };

describe("countVisibleItems", () => {
  it("counts only the matching items of a partly matching collection", () => {
    expect(
      countVisibleItems(["root"], map, {
        collectionVisibility: {
          root: CollectionVisibility.Some,
          sub: CollectionVisibility.Some,
          shared: CollectionVisibility.Hidden,
        },
        itemVisibility: {
          a: ItemVisibility.Visible,
          b: ItemVisibility.Hidden,
          c: ItemVisibility.Visible,
          d: ItemVisibility.Hidden,
        },
      }),
    ).toBe(2);
  });

  it("counts everything in a collection whose name matches", () => {
    expect(
      countVisibleItems(["root"], map, {
        collectionVisibility: { root: CollectionVisibility.All },
        itemVisibility: {},
      }),
    ).toBe(5);
  });

  it("counts nothing in hidden collections", () => {
    expect(
      countVisibleItems(["root", "missing"], map, {
        collectionVisibility: { root: CollectionVisibility.Hidden },
        itemVisibility: {},
      }),
    ).toBe(0);
  });
});
