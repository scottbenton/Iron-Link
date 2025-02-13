import { CollectionId, Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";

import { getRulesetFromId } from "./getRulesetFromId";

type Collections =
  | Datasworn.AssetCollection
  | Datasworn.MoveCategory
  | Datasworn.OracleCollection;

type Items =
  | Datasworn.Asset
  | Datasworn.Move
  | Datasworn.OracleRollable
  | Datasworn.OracleColumnText;

export type RootCollections = Record<
  string,
  {
    title: string;
    rootCollectionIds: string[];
  }
>;

export function parseCollectionsIntoMaps<C extends Collections>(
  tree: Record<string, Datasworn.RulesPackage>,
  playsetExclusions: {
    collectionExclusions: Record<string, boolean>;
    itemExclusions: Record<string, boolean>;
  },
  rootCollectionQueryRegex: string,
): {
  rootCollections: RootCollections;
  collectionMap: Record<string, C>;
  itemMap: C["contents"];
} {
  // Get the root collections
  IdParser.tree = tree;
  const rootCollectionQueryResult = CollectionId.getMatches(
    rootCollectionQueryRegex as Primary,
    tree,
  ) as Map<string, C>;

  const rootCollections: RootCollections = {};

  const collectionMap: Record<string, C> = {};
  const itemMap: C["contents"] = {};

  rootCollectionQueryResult.forEach((rootCollection) => {
    const isCollectionExcluded =
      playsetExclusions.collectionExclusions[rootCollection._id];
    if (isCollectionExcluded) return;

    const ruleset = getRulesetFromId(rootCollection._id, tree);
    if (!ruleset) return;

    if (!rootCollections[ruleset.id]) {
      rootCollections[ruleset.id] = {
        title: ruleset.title,
        rootCollectionIds: [],
      };
    }

    rootCollections[ruleset.id].rootCollectionIds.push(rootCollection._id);
  });

  Object.values(rootCollections).forEach(({ rootCollectionIds }) => {
    rootCollectionIds.forEach((rootCollectionId) => {
      const collection = rootCollectionQueryResult.get(rootCollectionId);
      if (collection) {
        collectionMap[collection._id] = collection;
        parseCollection(
          collection,
          tree,
          playsetExclusions,
          collectionMap,
          itemMap,
        );
      }
    });
  });

  return {
    rootCollections,
    collectionMap,
    itemMap,
  };
}

function parseCollection<C extends Collections>(
  collection: C,
  tree: Record<string, Datasworn.RulesPackage>,
  playsetExclusions: {
    collectionExclusions: Record<string, boolean>;
    itemExclusions: Record<string, boolean>;
  },
  collectionMap: Record<string, C>,
  itemMap: C["contents"],
) {
  const isExcluded = playsetExclusions.collectionExclusions[collection._id];
  if (isExcluded) return;

  collectionMap[collection._id] = collection;

  const filteredContents: C["contents"] = {};
  (Object.entries(collection.contents) as [string, Items][]).forEach(
    ([key, item]) => {
      const isItemExcluded = playsetExclusions.itemExclusions[item._id];
      if (isItemExcluded) return;

      item.replaces?.forEach((replacesKey) => {
        const replacedItems = IdParser.getMatches(replacesKey as Primary, tree);
        replacedItems.forEach((value) => {
          if (value.type === item.type) {
            itemMap[value._id] = value;
          }
        });
      });

      itemMap[item._id] = item;
      filteredContents[key] = item;
    },
  );
  collectionMap[collection._id].contents = filteredContents;

  const filteredCollections: Record<string, C> = {};
  if ("collections" in collection) {
    (Object.values(collection.collections) as C[]).forEach((subCollection) => {
      const isSubCollectionExcluded =
        playsetExclusions.collectionExclusions[subCollection._id];
      if (isSubCollectionExcluded) return;

      filteredCollections[subCollection._id] = subCollection;
      parseCollection(
        subCollection,
        tree,
        playsetExclusions,
        collectionMap,
        itemMap,
      );
    });
  }

  if (collection.replaces) {
    collection.replaces.forEach((replacesKey) => {
      const replacedItems = IdParser.getMatches(replacesKey as Primary, tree);
      replacedItems.forEach((value) => {
        if (value.type === collection.type) {
          collectionMap[value._id] = collection;
        }
      });
    });
  } else if (collection.enhances) {
    delete collectionMap[collection._id];
    collection.enhances.forEach((enhancesKey) => {
      const enhancedItems = IdParser.getMatches(enhancesKey as Primary, tree);
      enhancedItems.forEach((value) => {
        if (value.type === collection.type) {
          if (collectionMap[value._id]) {
            collectionMap[value._id].contents = {
              ...collectionMap[value._id].contents,
              ...filteredContents,
              //  type will be correct based on the value.type === collection.type above
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;
            if ("collections" in collection) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (collectionMap[value._id] as any).collections = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(collectionMap[value._id] as any).collections,
                ...filteredCollections,
              };
            }
          }
        }
      });
    });
  }
}
