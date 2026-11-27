import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import {
  DataswornOracleRowItem,
  DataswornTreeRowState,
} from "components/datasworn/DataswornTree";

import { IconButton } from "ui/components/IconButton";
import { OracleListItem } from "ui/game/OracleListItem";
import { DiceFiveIcon } from "ui/icons";

import { getReferenceItemHref } from "../../data/referencePaths";

export interface ReferenceOracleRowProps
  extends DataswornOracleRowItem,
    DataswornTreeRowState {
  rollOracle: (oracleId: string) => void;
}

// An oracle in the reference's list: a link to its page, with a quick roll
// beside it.
export function ReferenceOracleRow(props: ReferenceOracleRowProps) {
  const { id, name, canRoll, current, rollOracle } = props;
  const { t } = useTranslation();

  return (
    <OracleListItem
      name={name}
      render={<LinkComponent href={getReferenceItemHref(id) ?? ""} />}
      current={current}
      secondaryAction={
        canRoll ? (
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
