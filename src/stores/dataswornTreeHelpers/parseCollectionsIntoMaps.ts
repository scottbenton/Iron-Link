import {
  CollectionId,
  Datasworn,
  IdParser,
  StringId,
} from "@datasworn-community/core";

import { ironLinkAskTheOracleRulesPackage } from "data/askTheOracle";

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

export interface ParsedCollectionMaps<C extends Collections> {
  rootCollections: RootCollections;
  collectionMap: Record<string, C>;
  itemMap: C["contents"];
  collectionAliases: Record<string, string>;
  itemAliases: Record<string, string>;
}

export function parseCollectionsIntoMaps<C extends Collections>(
  tree: Record<string, Datasworn.RulesPackage>,
  playsetExclusions: {
    collectionExclusions: Record<string, boolean>;
    itemExclusions: Record<string, boolean>;
  },
  rootCollectionQueryRegex: string,
): ParsedCollectionMaps<C> {
  // Get the root collections
  IdParser.tree = tree;
  const rootCollectionQueryResult = CollectionId.getMatches(
    rootCollectionQueryRegex as StringId.Primary,
    tree,
  ) as Map<string, C>;

  const rootCollections: RootCollections = {};
  const allRootCollections: C[] = [];

  const collectionMap: Record<string, C> = {};
  const itemMap: C["contents"] = {};
  const collectionAliases: Record<string, string> = {};
  const itemAliases: Record<string, string> = {};
  const replacedCollectionIds = new Set<string>();
  const replacedItemIds = new Set<string>();
  const enhancedCollectionIds = new Set<string>();
  const enhancementTargets: Array<{ enhancerId: string; targetId: string }> =
    [];

  rootCollectionQueryResult.forEach((rootCollection) => {
    const isCollectionExcluded =
      playsetExclusions.collectionExclusions[rootCollection._id];
    if (isCollectionExcluded) return;

    const ruleset = getRulesetFromId(rootCollection._id, tree);

    if (!ruleset) return;

    allRootCollections.push(rootCollection);

    if (ruleset.id === ironLinkAskTheOracleRulesPackage._id) return;
    if (!rootCollections[ruleset.id]) {
      rootCollections[ruleset.id] = {
        title: ruleset.title,
        rootCollectionIds: [],
      };
    }
    rootCollections[ruleset.id].rootCollectionIds.push(rootCollection._id);
  });

  allRootCollections.forEach((collection) => {
    const parsedCollection = parseCollection(
      collection,
      tree,
      playsetExclusions,
      collectionMap,
      itemMap,
      collectionAliases,
      itemAliases,
      replacedCollectionIds,
      replacedItemIds,
      enhancedCollectionIds,
      enhancementTargets,
    );
    if (parsedCollection) {
      collectionMap[parsedCollection._id] = parsedCollection;
    }
  });

  enhancementTargets.forEach(({ enhancerId, targetId }) => {
    const enhancer = collectionMap[enhancerId];
    const target = collectionMap[targetId];
    if (enhancer && target) {
      mergeCollectionEnhancement(target, enhancer);
    }
  });

  Object.values(collectionMap).forEach((collection) => {
    removeHiddenEntries(collection, replacedCollectionIds, replacedItemIds);
  });

  Object.entries(collectionAliases).forEach(([replacedId, replacementId]) => {
    const replacement = collectionMap[replacementId];
    if (replacement) {
      collectionMap[replacedId] = replacement;
    }
  });

  Object.entries(itemAliases).forEach(([replacedId, replacementId]) => {
    const replacement = itemMap[replacementId];
    if (replacement) {
      itemMap[replacedId as keyof C["contents"]] = replacement;
    }
  });

  Object.values(rootCollections).forEach((rootCollection) => {
    rootCollection.rootCollectionIds = rootCollection.rootCollectionIds.filter(
      (rootCollectionId) =>
        !replacedCollectionIds.has(rootCollectionId) &&
        !enhancedCollectionIds.has(rootCollectionId),
    );
  });

  Object.entries(rootCollections).forEach(([rulesetId, rootCollection]) => {
    if (rootCollection.rootCollectionIds.length === 0) {
      delete rootCollections[rulesetId];
    }
  });

  return {
    rootCollections,
    collectionMap,
    itemMap,
    collectionAliases,
    itemAliases,
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
  collectionAliases: Record<string, string>,
  itemAliases: Record<string, string>,
  replacedCollectionIds: Set<string>,
  replacedItemIds: Set<string>,
  enhancedCollectionIds: Set<string>,
  enhancementTargets: Array<{ enhancerId: string; targetId: string }>,
): C | undefined {
  const isExcluded = playsetExclusions.collectionExclusions[collection._id];
  if (isExcluded) return undefined;

  const filteredContents: C["contents"] = {};
  (Object.entries(collection.contents) as [string, Items][]).forEach(
    ([key, item]) => {
      const isItemExcluded = playsetExclusions.itemExclusions[item._id];
      if (isItemExcluded) return;

      item.replaces?.forEach((replacesKey) => {
        const replacedItems = IdParser.getMatches(
          replacesKey as StringId.Primary,
          tree,
        );
        replacedItems.forEach((value) => {
          if (value.type === item.type) {
            itemAliases[value._id] = item._id;
            replacedItemIds.add(value._id);
          }
        });
      });

      itemMap[item._id as keyof C["contents"]] = item;
      filteredContents[key as keyof C["contents"]] = item;
    },
  );

  const filteredCollections: Record<string, C> = {};
  if ("collections" in collection) {
    (Object.values(collection.collections) as C[]).forEach((subCollection) => {
      const parsedSubCollection = parseCollection(
        subCollection,
        tree,
        playsetExclusions,
        collectionMap,
        itemMap,
        collectionAliases,
        itemAliases,
        replacedCollectionIds,
        replacedItemIds,
        enhancedCollectionIds,
        enhancementTargets,
      );
      if (parsedSubCollection) {
        filteredCollections[parsedSubCollection._id] = parsedSubCollection;
      }
    });
  }

  const parsedCollection = {
    ...collection,
    contents: filteredContents,
    ...("collections" in collection
      ? { collections: filteredCollections }
      : undefined),
  } as C;
  collectionMap[parsedCollection._id] = parsedCollection;

  collection.replaces?.forEach((replacesKey) => {
    const replacedItems = IdParser.getMatches(
      replacesKey as StringId.Primary,
      tree,
    );
    replacedItems.forEach((value) => {
      if (value.type === collection.type) {
        collectionAliases[value._id] = collection._id;
        replacedCollectionIds.add(value._id);
      }
    });
  });

  collection.enhances?.forEach((enhancesKey) => {
    const enhancedItems = IdParser.getMatches(
      enhancesKey as StringId.Primary,
      tree,
    );
    enhancedItems.forEach((value) => {
      if (value.type === collection.type) {
        enhancedCollectionIds.add(collection._id);
        enhancementTargets.push({
          enhancerId: collection._id,
          targetId: value._id,
        });
      }
    });
  });

  return parsedCollection;
}

function mergeCollectionEnhancement<C extends Collections>(
  target: C,
  enhancer: C,
) {
  const enhancedItemReplacementIds = new Set<string>();
  (Object.values(enhancer.contents) as Items[]).forEach((item) => {
    item.replaces?.forEach((replacedId) => {
      enhancedItemReplacementIds.add(replacedId);
    });
  });

  target.contents = {
    ...filterRecordByItemId(target.contents, enhancedItemReplacementIds),
    ...enhancer.contents,
  };

  if ("collections" in target && "collections" in enhancer) {
    const enhancedCollectionReplacementIds = new Set<string>();
    (Object.values(enhancer.collections) as C[]).forEach((collection) => {
      collection.replaces?.forEach((replacedId) => {
        enhancedCollectionReplacementIds.add(replacedId);
      });
    });

    target.collections = {
      ...filterRecordByItemId(
        target.collections as Record<string, C>,
        enhancedCollectionReplacementIds,
      ),
      ...(enhancer.collections as Record<string, C>),
    };
  }
}

function removeHiddenEntries<C extends Collections>(
  collection: C,
  replacedCollectionIds: Set<string>,
  replacedItemIds: Set<string>,
) {
  collection.contents = filterRecordByItemId(collection.contents, replacedItemIds);

  if ("collections" in collection) {
    collection.collections = filterRecordByItemId(
      collection.collections as Record<string, C>,
      replacedCollectionIds,
    );
    (Object.values(collection.collections) as C[]).forEach((subCollection) => {
      removeHiddenEntries(subCollection, replacedCollectionIds, replacedItemIds);
    });
  }
}

function filterRecordByItemId<T extends { _id: string }>(
  record: Record<string, T>,
  removedIds: Set<string>,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => !removedIds.has(value._id)),
  );
}
