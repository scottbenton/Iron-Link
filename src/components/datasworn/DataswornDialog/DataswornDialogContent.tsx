import { EmptyState } from "@/components/layout/EmptyState";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { Box, Button, Dialog } from "@chakra-ui/react";

import { AssetCard } from "../AssetCard";
import { Move } from "../Move";
import { Oracle } from "../Oracle";
import { OracleTableSharedText } from "../Oracle/OracleTableSharedText";
import { DataswornDialogTitle } from "./DataswornDialogTitle";
import { useGetDataswornItem } from "./useGetDataswornItem";

export interface DataswornDialogContent {
  id: string;
  onClose: () => void;
}

export function DataswornDialogContent(props: DataswornDialogContent) {
  const { id, onClose } = props;
  const t = useDataswornTranslations();

  const item = useGetDataswornItem(id);

  if (item?.type === "oracle_rollable") {
    return (
      <>
        <DataswornDialogTitle>{item.oracle.name}</DataswornDialogTitle>
        <Dialog.Body>
          <Oracle oracleId={item.oracle._id} hideOracleName />
        </Dialog.Body>
      </>
    );
  }

  if (item?.type === "move") {
    return (
      <>
        <DataswornDialogTitle>{item.move.name}</DataswornDialogTitle>
        <Dialog.Body>
          <Move moveId={item.move._id} hideMoveName />
        </Dialog.Body>
      </>
    );
  }

  if (item?.type === "asset") {
    return (
      <>
        <DataswornDialogTitle>{item.asset.name}</DataswornDialogTitle>
        <Dialog.Body>
          <Box maxW={"sm"} mx="auto">
            <AssetCard assetId={item.asset._id} />
          </Box>
        </Dialog.Body>
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
        <Dialog.Body>
          <OracleTableSharedText oracle={item.oracleCollection} />
        </Dialog.Body>
      </>
    );
  }
  return (
    <>
      <DataswornDialogTitle>
        {t("datasworn.dialog.not-found-title", "Could not find item")}
      </DataswornDialogTitle>
      <Dialog.Body>
        <EmptyState
          message={t(
            "datasworn.dialog.not-found-content",
            "The linked item with id {{itemId}} could not be found.",
            { itemId: id },
          )}
        />
      </Dialog.Body>
      <Dialog.Footer>
        <Button onClick={onClose}>{t("common.close", "Close")}</Button>
      </Dialog.Footer>
    </>
  );
}
