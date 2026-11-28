import { useState } from "react";
import { useTranslation } from "react-i18next";

import { IconButton } from "ui/components/IconButton";
import { Select } from "ui/components/Select";
import { OracleListItem } from "ui/game/OracleListItem";
import { TableIcon } from "ui/icons";
import { Flex } from "ui/primitives";

import { useOpenDataswornDialog } from "stores/appState.store";
import { useOracles } from "stores/dataswornTree.store";

export interface OracleTreeSharedTextRowProps {
  id: string;
  name: string;
  rollOracle: (oracleId: string) => void;
}

// A table whose columns share one roll, such as a creature's form by
// environment: the row rolls the column chosen beside it.
export function OracleTreeSharedTextRow(props: OracleTreeSharedTextRowProps) {
  const { id, name, rollOracle } = props;
  const { t } = useTranslation();
  const openDialog = useOpenDataswornDialog();

  const collection = useOracles().oracleCollectionMap[id];
  const columns =
    collection && "contents" in collection ? (collection.contents ?? {}) : {};
  const keys = Object.keys(columns);
  const [selected, setSelected] = useState(keys[0] ?? "");
  const selectedId = columns[selected]?._id;

  return (
    <OracleListItem
      name={name}
      onRoll={selectedId ? () => rollOracle(selectedId) : undefined}
      disabled={!selectedId}
      css={{ "--row-action-width": "calc(9rem + token(sizes.control.sm))" }}
      secondaryAction={
        <Flex align="center" gap="1">
          {keys.length > 0 && (
            <Select
              size="sm"
              aria-label={t("datasworn.oracle.option-for", "{{name}} option", {
                name,
              })}
              options={keys.map((key) => ({
                value: key,
                label: columns[key].name,
              }))}
              value={selected}
              onValueChange={(value) => value && setSelected(value)}
              css={{ width: "9rem" }}
            />
          )}
          <IconButton
            size="sm"
            label={t(
              "datasworn.oracle.view-full-table-for",
              "View full table for {{name}}",
              { name },
            )}
            onClick={() => openDialog(id)}
          >
            <TableIcon />
          </IconButton>
        </Flex>
      }
    />
  );
}
