import { OracleListItem } from "../../game/OracleListItem";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import {
  LooseOracleCollection,
  TreeOpenOptions,
  countOracles,
  isSharedRoll,
  oracleCountLabel,
  startsOpen,
} from "./referenceTreeHelpers";

/** An oracle collection and everything under it. */
export function OracleCollectionTree(
  props: { collection: LooseOracleCollection } & TreeOpenOptions,
) {
  const { collection, ...options } = props;
  return (
    <ReferenceCategory
      title={collection.name}
      count={countOracles(collection)}
      countLabel={oracleCountLabel}
      defaultOpen={startsOpen(collection._id, options)}
    >
      {Object.values(collection.contents ?? {}).map((oracle) => (
        <OracleListItem key={oracle._id} name={oracle.name} onRoll={() => {}} />
      ))}
      {Object.values(collection.collections ?? {}).map((child) =>
        isSharedRoll(child) ? (
          <OracleListItem key={child._id} name={child.name} onRoll={() => {}} />
        ) : (
          <OracleCollectionTree
            key={child._id}
            collection={child}
            {...options}
          />
        ),
      )}
    </ReferenceCategory>
  );
}
