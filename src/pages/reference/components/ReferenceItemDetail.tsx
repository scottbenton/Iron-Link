import { Datasworn } from "@datasworn-community/core";

import { AssetCard } from "components/datasworn/AssetCard";
import { getDataswornItem } from "components/datasworn/DataswornDialog/useGetDataswornItem";
import { Move } from "components/datasworn/Move";
import { Oracle } from "components/datasworn/Oracle";
import { OracleTableSharedText } from "components/datasworn/Oracle/OracleTableSharedText";
import { isLeafCollection } from "components/datasworn/_helpers/dataswornTreeFilter";

import { RulesText } from "ui/game/RulesText";
import { Stack } from "ui/primitives";

import { ReferenceSection, ReferenceTab } from "../data/referenceTabs";
import { ReferenceCollectionContents } from "./ReferenceCollectionContents";
import { ReferenceItemHeader } from "./ReferenceItemHeader";
import { ReferenceMoveRolls } from "./ReferenceMoveRolls";

export type ReferenceItem = NonNullable<ReturnType<typeof getDataswornItem>>;

export interface ReferenceItemDetailProps {
  item: ReferenceItem;
  tab: ReferenceTab;
  section: ReferenceSection;
}

function getCollectionName(id: string): string | undefined {
  const item = getDataswornItem(id);
  if (!item) return undefined;
  if (item.type === "move_category") return item.moveCategory.name;
  if (item.type === "oracle_collection") return item.oracleCollection.name;
  if (item.type === "asset_collection") return item.assetCollection.name;
  return undefined;
}

// A move, oracle, asset, or a collection of moves or oracles, on its own
// page.
export function ReferenceItemDetail(props: ReferenceItemDetailProps) {
  const { item, tab, section } = props;

  const headerProps = { tab, section, getCollectionName };

  switch (item.type) {
    case "move":
      return (
        <>
          <ReferenceItemHeader
            id={item.move._id}
            name={item.move.name}
            {...headerProps}
          />
          <ReferenceMoveRolls key={item.move._id} move={item.move} />
          <Move moveId={item.move._id} hideRollOptions />
        </>
      );
    case "oracle_rollable":
      return (
        <>
          <ReferenceItemHeader
            id={item.oracle._id}
            name={item.oracle.name}
            {...headerProps}
          />
          <Oracle oracleId={item.oracle._id} />
        </>
      );
    case "asset":
      return (
        <>
          <ReferenceItemHeader
            id={item.asset._id}
            name={item.asset.name}
            {...headerProps}
          />
          <AssetCard assetId={item.asset._id} css={{ maxWidth: "420px" }} />
        </>
      );
    case "move_category":
      return (
        <>
          <ReferenceItemHeader
            id={item.moveCategory._id}
            name={item.moveCategory.name}
            {...headerProps}
          />
          <ReferenceCollectionContents
            description={item.moveCategory.description}
            items={Object.values(item.moveCategory.contents ?? {})}
          />
        </>
      );
    case "oracle_collection": {
      const collection = item.oracleCollection;
      return (
        <>
          <ReferenceItemHeader
            id={collection._id}
            name={collection.name}
            {...headerProps}
          />
          {isLeafCollection(collection) ? (
            <Stack gap="3">
              {collection.description && (
                <RulesText markdown={collection.description} size="sm" />
              )}
              <OracleTableSharedText
                oracle={
                  collection as
                    | Datasworn.OracleTableSharedText
                    | Datasworn.OracleTableSharedText2
                    | Datasworn.OracleTableSharedText3
                }
              />
            </Stack>
          ) : (
            <ReferenceCollectionContents
              description={collection.description}
              items={[
                ...Object.values(collection.contents ?? {}),
                ...Object.values(
                  ("collections" in collection
                    ? collection.collections
                    : undefined) ?? {},
                ),
              ]}
            />
          )}
        </>
      );
    }
    default:
      return null;
  }
}
