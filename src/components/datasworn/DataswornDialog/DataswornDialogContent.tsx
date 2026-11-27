import { useTranslation } from "react-i18next";

import { DialogBody } from "ui/components/Dialog";
import { EmptyState } from "ui/layout";
import { Box } from "ui/primitives";

import { AssetCard } from "../AssetCard";
import { Move } from "../Move";
import { Oracle } from "../Oracle";
import { OracleTableSharedText } from "../Oracle/OracleTableSharedText";
import { DataswornDialogTitle } from "./DataswornDialogTitle";
import { useGetDataswornItem } from "./useGetDataswornItem";

export interface DataswornDialogContentProps {
  id: string;
}

// What the dialog shows for an id, or a note that it can't be found. The
// header's Close is the one way out, so there is no second Close button.
export function DataswornDialogContent(props: DataswornDialogContentProps) {
  const { id } = props;
  const { t } = useTranslation();

  const item = useGetDataswornItem(id);

  if (item?.type === "oracle_rollable") {
    return (
      <>
        <DataswornDialogTitle>{item.oracle.name}</DataswornDialogTitle>
        <DialogBody>
          <Oracle oracleId={item.oracle._id} />
        </DialogBody>
      </>
    );
  }

  if (item?.type === "move") {
    return (
      <>
        <DataswornDialogTitle>{item.move.name}</DataswornDialogTitle>
        <DialogBody>
          <Move moveId={item.move._id} />
        </DialogBody>
      </>
    );
  }

  if (item?.type === "asset") {
    return (
      <>
        <DataswornDialogTitle>{item.asset.name}</DataswornDialogTitle>
        <DialogBody>
          <Box width="100%" maxWidth="350px" marginInline="auto">
            <AssetCard assetId={item.asset._id} />
          </Box>
        </DialogBody>
      </>
    );
  }

  if (
    item?.type === "oracle_collection" &&
    (item.oracleCollection.oracle_type === "table_shared_text" ||
      item.oracleCollection.oracle_type === "table_shared_text2" ||
      item.oracleCollection.oracle_type === "table_shared_text3")
  ) {
    return (
      <>
        <DataswornDialogTitle>
          {item.oracleCollection.name}
        </DataswornDialogTitle>
        <DialogBody>
          <OracleTableSharedText oracle={item.oracleCollection} />
        </DialogBody>
      </>
    );
  }
  return (
    <>
      <DataswornDialogTitle>
        {t("datasworn.dialog.not-found-title", "Could not find item")}
      </DataswornDialogTitle>
      <DialogBody>
        <EmptyState
          message={t(
            "datasworn.dialog.not-found-content",
            "The linked item with id {{itemId}} could not be found.",
            { itemId: id },
          )}
        />
      </DialogBody>
    </>
  );
}
