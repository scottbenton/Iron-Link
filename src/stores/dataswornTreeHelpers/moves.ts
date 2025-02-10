import { CollectionId, Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";

import {
  MoveCategoryMap,
  MoveMap,
  RootMoveCategories,
} from "stores/dataswornTree.store";

import { getRulesetFromId } from "./getRulesetFromId";

function parseMoveCategory(
  category: Datasworn.MoveCategory,
  tree: Record<string, Datasworn.RulesPackage>,
  moveCategoryMap: MoveCategoryMap,
  moveMap: MoveMap,
) {
  Object.keys(category.contents).forEach((moveKey) => {
    const move = category.contents[moveKey];
    if (move.replaces) {
      move.replaces.forEach((replacesKey) => {
        const replacedItems = IdParser.getMatches(replacesKey as Primary, tree);
        replacedItems.forEach((value) => {
          if (value.type === "move") {
            moveMap[value._id] = move;
          }
        });
      });
    }
    moveMap[move._id] = move;
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

export function parseMoves(trees: Record<string, Datasworn.RulesPackage>): {
  rootMoveCategories: RootMoveCategories;
  moveCategoryMap: MoveCategoryMap;
  moveMap: MoveMap;
} {
  IdParser.tree = trees;
  const rootMoveCategoriesMap = CollectionId.getMatches(
    "move_category:*/*",
    trees,
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
}
