import { MoveListItem } from "../../game/MoveListItem";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import {
  LooseMoveCategory,
  TreeOpenOptions,
  moveCountLabel,
  startsOpen,
} from "./referenceTreeHelpers";

/** A move category, with any categories nested in it (custom content). */
export function MoveCategoryTree(
  props: { category: LooseMoveCategory } & TreeOpenOptions,
) {
  const { category, ...options } = props;
  const children = Object.values(category.collections ?? {});
  const count = (c: LooseMoveCategory): number =>
    Object.keys(c.contents).length +
    Object.values(c.collections ?? {}).reduce((n, x) => n + count(x), 0);
  return (
    <ReferenceCategory
      title={category.name}
      count={count(category)}
      countLabel={moveCountLabel}
      defaultOpen={startsOpen(category._id, options)}
    >
      {Object.values(category.contents).map((move) => (
        <MoveListItem key={move._id} move={move} />
      ))}
      {children.map((child) => (
        <MoveCategoryTree
          key={child._id ?? child.name}
          category={child}
          {...options}
        />
      ))}
    </ReferenceCategory>
  );
}
