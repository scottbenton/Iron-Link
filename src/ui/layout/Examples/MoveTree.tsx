import {
  moveCountLabel,
  starforgedMoveCategories,
} from "../../docs/fixtures/referenceTrees";
import { MoveListItem } from "../../game/MoveListItem";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import { openCategoryIds, treeStyles } from "./playLayoutsShared";
import { PlaySheet } from "./usePlaySheet";

/** Starforged's moves, each opening in place with Kira's roll buttons. */
export function MoveTree(props: { sheet: PlaySheet }) {
  const { sheet } = props;
  return (
    <div className={treeStyles}>
      {starforgedMoveCategories.map((category) => (
        <ReferenceCategory
          key={category._id ?? category.name}
          title={category.name}
          count={Object.keys(category.contents).length}
          countLabel={moveCountLabel}
          defaultOpen={!!category._id && openCategoryIds.has(category._id)}
        >
          {Object.values(category.contents).map((move) => (
            <MoveListItem
              key={move._id}
              move={move}
              moveCardProps={{
                rollOptions: sheet.moveRollOptions(move),
                onRoll: (option) =>
                  sheet.roll(option.label, option.value ?? 0, move.name),
              }}
            />
          ))}
        </ReferenceCategory>
      ))}
    </div>
  );
}
