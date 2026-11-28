import { useTranslation } from "react-i18next";

import { OracleListItem } from "ui/game/OracleListItem";

import { useOpenDataswornDialog } from "stores/appState.store";

export interface OracleTreeRowProps {
  id: string;
  name: string;
  description?: string;
  rollOracle: (oracleId: string) => void;
}

// An oracle in a game's list: the row rolls it, the button beside it opens
// the full table.
export function OracleTreeRow(props: OracleTreeRowProps) {
  const { id, name, description, rollOracle } = props;
  const { t } = useTranslation();
  const openDialog = useOpenDataswornDialog();

  return (
    <OracleListItem
      name={name}
      description={description}
      onRoll={() => rollOracle(id)}
      onViewTable={() => openDialog(id)}
      viewTableLabel={(oracle) =>
        t(
          "datasworn.oracle.view-full-table-for",
          "View full table for {{name}}",
          {
            name: oracle,
          },
        )
      }
    />
  );
}
