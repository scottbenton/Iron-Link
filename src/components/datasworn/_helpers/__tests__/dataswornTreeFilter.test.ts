import { describe, expect, it } from "vitest";

import {
  DataswornTreeCollection,
  filterDataswornTree,
  getAncestorCollectionIds,
  getDataswornTreeVisibility,
} from "../dataswornTreeFilter";

const collectionMap: Record<string, DataswornTreeCollection> = {
  "oracle_collection:a/planets": {
    _id: "oracle_collection:a/planets",
    name: "Planets",
    contents: {},
    collections: {
      desert: {
        _id: "oracle_collection:a/planets/desert",
        name: "Desert World",
      },
      jungle: {
        _id: "oracle_collection:a/planets/jungle",
        name: "Jungle World",
      },
    },
  },
  "oracle_collection:a/planets/desert": {
    _id: "oracle_collection:a/planets/desert",
    name: "Desert World",
    contents: {
      feature: {
        _id: "oracle_rollable:a/planets/desert/feature",
        name: "Feature",
      },
      life: { _id: "oracle_rollable:a/planets/desert/life", name: "Life" },
    },
  },
  "oracle_collection:a/planets/jungle": {
    _id: "oracle_collection:a/planets/jungle",
    name: "Jungle World",
    contents: {
      feature: {
        _id: "oracle_rollable:a/planets/jungle/feature",
        name: "Feature",
      },
    },
  },
  "oracle_collection:b/factions": {
    _id: "oracle_collection:b/factions",
    name: "Factions",
    oracle_type: "table_shared_text",
    contents: {
      name: { _id: "oracle_rollable:b/factions/name", name: "Name" },
    },
  },
};

const roots = ["oracle_collection:a/planets", "oracle_collection:b/factions"];
const all = () => true;

describe("getDataswornTreeVisibility", () => {
  it("shows everything with no search", () => {
    const visibility = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "",
      all,
    );
    expect(visibility.items.size).toBe(3);
    expect(visibility.collections.has("oracle_collection:b/factions")).toBe(
      true,
    );
  });

  it("shows an item matching the search and the collections around it", () => {
    const visibility = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "life",
      all,
    );
    expect([...visibility.items]).toEqual([
      "oracle_rollable:a/planets/desert/life",
    ]);
    expect(visibility.collections).toEqual(
      new Set([
        "oracle_collection:a/planets",
        "oracle_collection:a/planets/desert",
      ]),
    );
  });

  it("shows a matching collection's whole contents", () => {
    const visibility = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "  JUNGLE ",
      all,
    );
    expect([...visibility.items]).toEqual([
      "oracle_rollable:a/planets/jungle/feature",
    ]);
  });

  it("treats a shared-table collection as one item", () => {
    const visibility = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "name",
      all,
    );
    expect(visibility.items.size).toBe(0);
    expect(visibility.collections).toEqual(new Set());

    const byName = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "fact",
      all,
    );
    expect(byName.collections).toEqual(
      new Set(["oracle_collection:b/factions"]),
    );
  });

  it("leaves out hidden sources", () => {
    const visibility = getDataswornTreeVisibility(
      roots,
      collectionMap,
      "",
      (id) => !id.includes(":b/"),
    );
    expect(visibility.collections.has("oracle_collection:b/factions")).toBe(
      false,
    );
    expect(visibility.items.size).toBe(3);
  });
});

describe("getAncestorCollectionIds", () => {
  it("lists the collections from the root down", () => {
    expect(
      getAncestorCollectionIds(
        roots,
        collectionMap,
        "oracle_rollable:a/planets/jungle/feature",
      ),
    ).toEqual([
      "oracle_collection:a/planets",
      "oracle_collection:a/planets/jungle",
    ]);
  });

  it("leaves out the target collection itself", () => {
    expect(
      getAncestorCollectionIds(
        roots,
        collectionMap,
        "oracle_collection:a/planets/desert",
      ),
    ).toEqual(["oracle_collection:a/planets"]);
  });

  it("finds nothing for an unknown id", () => {
    expect(getAncestorCollectionIds(roots, collectionMap, "nope")).toEqual([]);
  });
});

describe("filterDataswornTree", () => {
  it("keeps only visible items and drops collections left empty", () => {
    const filtered = filterDataswornTree(
      ["oracle_collection:a/planets"],
      collectionMap,
      (id) => !id.includes("/jungle"),
    );
    expect(filtered.rootCollectionIds).toEqual(["oracle_collection:a/planets"]);
    expect(
      Object.keys(
        filtered.collectionMap["oracle_collection:a/planets"].collections ?? {},
      ),
    ).toEqual(["desert"]);
    expect(
      filtered.collectionMap["oracle_collection:a/planets/jungle"],
    ).toBeUndefined();
  });

  it("drops a root whose contents are all hidden", () => {
    const filtered = filterDataswornTree(
      ["oracle_collection:a/planets"],
      collectionMap,
      () => false,
    );
    expect(filtered.rootCollectionIds).toEqual([]);
    expect(filtered.collectionMap).toEqual({});
  });
});
