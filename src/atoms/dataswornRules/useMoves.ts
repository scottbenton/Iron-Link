import { CollectionId, Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";
import { dataswornTreeAtom } from "atoms/dataswornTree.atom";
import { atom, useAtomValue } from "jotai";
import { getRulesetFromId } from "./getRulesetFromId";
import { useActiveAssetMoveCategories } from "components/datasworn/hooks/useActiveAssetMoveCategories";

export type RootMoveCategories = Record<
  string,
  { title: string; rootMoves: string[] }
>;
export type MoveCategoryMap = Record<string, Datasworn.MoveCategory>;
export type MoveMap = Record<string, Datasworn.Move>;

function parseMoveCategory(
  category: Datasworn.MoveCategory,
  tree: Record<string, Datasworn.RulesPackage>,
  moveCategoryMap: MoveCategoryMap,
  moveMap: MoveMap
) {
  Object.keys(category.contents).forEach((moveKey) => {
    const oracle = category.contents[moveKey];
    if (oracle.replaces) {
      oracle.replaces.forEach((replacesKey) => {
        const replacedItems = IdParser.getMatches(replacesKey as Primary, tree);
        replacedItems.forEach((value) => {
          if (value.type === "move") {
            moveMap[value._id] = value;
          }
        });
      });
    }
    moveMap[oracle._id] = oracle;
  });

  Object.values(category.collections).forEach((subCollection) => {
    moveCategoryMap[subCollection._id] = subCollection;
    parseMoveCategory(subCollection, tree, moveCategoryMap, moveMap);
  });

  if (category.replaces) {
    delete moveCategoryMap[category._id];
    category.replaces.forEach((replacesKey) => {
      const replacedItems = IdParser.getMatches(replacesKey as Primary, tree);
      replacedItems.forEach((value) => {
        if (value.type === "move_category") {
          moveCategoryMap[value._id] = category;
        }
      });
    });
  } else if (category.enhances) {
    delete moveCategoryMap[category._id];
    category.enhances.forEach((enhancesKey) => {
      const enhancedItems = IdParser.getMatches(enhancesKey as Primary, tree);
      enhancedItems.forEach((value) => {
        if (value.type === "move_category") {
          moveCategoryMap[value._id].contents = {
            ...moveCategoryMap[value._id].contents,
            ...value.contents,
            //  type will be correct based on the value.oracleType === colleciton.oracleType above
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
          moveCategoryMap[value._id].collections = {
            ...moveCategoryMap[value._id].collections,
            ...value.collections,
          };
        }
      });
    });
  }
}

const movesAtom = atom((get) => {
  const trees = get(dataswornTreeAtom);

  IdParser.tree = trees;
  const rootMoveCategoriesMap = CollectionId.getMatches(
    "move_category:*/*",
    trees
  );

  const rootMoveCategories: RootMoveCategories = {};
  const moveCategoryMap: MoveCategoryMap = {};
  const moveMap: MoveMap = {};

  rootMoveCategoriesMap.forEach((collection) => {
    const ruleset = getRulesetFromId(collection._id, trees);
    if (!ruleset) return;

    if (!rootMoveCategories[ruleset.id]) {
      rootMoveCategories[ruleset.id] = {
        title: ruleset.title,
        rootMoves: [],
      };
    }
    rootMoveCategories[ruleset.id].rootMoves.push(collection._id);
  });

  Object.values(rootMoveCategories).forEach(({ rootMoves }) => {
    rootMoves.forEach((rootMoveId) => {
      const collection = rootMoveCategoriesMap.get(rootMoveId);
      if (collection) {
        moveCategoryMap[collection._id] = collection;
        parseMoveCategory(collection, trees, moveCategoryMap, moveMap);
      }
    });
  });

  return { rootMoveCategories, moveCategoryMap, moveMap };
});

export function useMoves() {
  const assetMoveCategories = useActiveAssetMoveCategories();
  const { rootMoveCategories, moveCategoryMap, moveMap } =
    useAtomValue(movesAtom);

  if (Object.keys(assetMoveCategories).length > 0) {
    const rootMoveCategoriesWithAssetCategories = {
      ...rootMoveCategories,
    };
    let moveCategoryMapWithAssetCategories = {
      ...moveCategoryMap,
    };
    let moveMapWithAssetMoves = {
      ...moveMap,
    };

    Object.entries(assetMoveCategories).forEach(
      ([rulesetId, assetMoveCategory]) => {
        rootMoveCategoriesWithAssetCategories[rulesetId] = {
          ...rootMoveCategoriesWithAssetCategories[rulesetId],
          rootMoves: [
            ...rootMoveCategoriesWithAssetCategories[rulesetId].rootMoves,
            assetMoveCategory._id,
          ],
        };
        moveCategoryMapWithAssetCategories = {
          ...moveCategoryMapWithAssetCategories,
          [assetMoveCategory._id]: assetMoveCategory,
        };
        moveMapWithAssetMoves = {
          ...moveMapWithAssetMoves,
          ...assetMoveCategory.contents,
        };
      }
    );

    return {
      rootMoveCategories: rootMoveCategoriesWithAssetCategories,
      moveCategoryMap: moveCategoryMapWithAssetCategories,
      moveMap: moveMapWithAssetMoves,
    };
  }

  return { rootMoveCategories, moveCategoryMap, moveMap };
}