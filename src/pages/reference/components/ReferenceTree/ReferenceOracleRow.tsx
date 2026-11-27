import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { IconButton } from "ui/components/IconButton";
import { OracleListItem } from "ui/game/OracleListItem";
import { DiceFiveIcon } from "ui/icons";

import { getReferenceItemHref } from "../../data/referencePaths";
import { useReferenceTreeContext } from "./referenceTreeContext";

export interface ReferenceOracleRowProps {
  id: string;
  name: string;
  // A single table rolls from its row; a shared-text table opens to roll.
  canRoll?: boolean;
}

// An oracle in the reference's list: a link to its page, with a quick roll
// beside it.
export function ReferenceOracleRow(props: ReferenceOracleRowProps) {
  const { id, name, canRoll = false } = props;
  const { t } = useTranslation();
  const { selectedId, rollOracle } = useReferenceTreeContext();

  return (
    <OracleListItem
      name={name}
      render={<LinkComponent href={getReferenceItemHref(id) ?? ""} />}
      current={selectedId === id}
      secondaryAction={
        canRoll && rollOracle ? (
          <IconButton
            size="sm"
            label={t("reference.oracles.roll-named", "Roll {{name}}", {
              name,
            })}
            onClick={() => rollOracle(id)}
          >
            <DiceFiveIcon />
          </IconButton>
        ) : undefined
      }
    />
  );
}
