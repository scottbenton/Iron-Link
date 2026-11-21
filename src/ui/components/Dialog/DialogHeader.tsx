import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { css } from "styled-system/css";

import { IconButton } from "../IconButton";
import { Text } from "../Text";

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  paddingBlockStart: "4",
  paddingInlineStart: "5",
  paddingInlineEnd: "3",
  flex: "none",
});

export interface DialogHeaderProps {
  /** The dialog's name. Only this is the title element. */
  title: ReactNode;
  /** Buttons beside the title, before Close. */
  actions?: ReactNode;
  /** Label for the close button. */
  closeLabel?: string;
  hideClose?: boolean;
}

/**
 * The title and a Close button. Only the heading is the dialog's title, so
 * the dialog's accessible name is the title alone; buttons sit beside it.
 */
export function DialogHeader(props: DialogHeaderProps) {
  const { t } = useTranslation();
  const {
    title,
    actions,
    closeLabel = t("ui.common.close", "Close"),
    hideClose,
  } = props;
  return (
    <div className={headerStyles}>
      <BaseDialog.Title
        render={<Text variant="h2" />}
        className={css({ minWidth: 0 })}
      >
        {title}
      </BaseDialog.Title>
      <div className={css({ display: "flex", gap: "1", flex: "none" })}>
        {actions}
        {!hideClose && (
          <BaseDialog.Close
            render={
              <IconButton label={closeLabel} tooltipSide="bottom">
                <X />
              </IconButton>
            }
          />
        )}
      </div>
    </div>
  );
}
