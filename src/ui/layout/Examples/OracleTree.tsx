import {
  OracleCollectionTree,
  starforgedOracleCollections,
} from "../../docs/fixtures/referenceTrees";
import { openCategoryIds, treeStyles } from "./playLayoutsShared";

export function OracleTree() {
  return (
    <div className={treeStyles}>
      {starforgedOracleCollections.map((collection) => (
        <OracleCollectionTree
          key={collection._id}
          collection={collection}
          openIds={openCategoryIds}
        />
      ))}
    </div>
  );
}
