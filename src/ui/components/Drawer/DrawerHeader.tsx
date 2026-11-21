import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { XIcon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { css, cx } from "styled-system/css";

import { IconButton } from "../IconButton";
import { Text } from "../Text";

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  flex: "none",
  paddingBlockStart: "4",
  paddingBlockEnd: "2",
  paddingInlineStart: "5",
  paddingInlineEnd: "3",
  "[data-placement=bottom] > &": { paddingBlockStart: "2" },
});

export interface DrawerHeaderProps {
  /** The drawer's name. Only this is the title element. */
  title: ReactNode;
  /** Buttons beside the title, before Close. */
  actions?: ReactNode;
  closeLabel?: string;
  hideClose?: boolean;
  className?: string;
}

/** The title and a Close button. */
export function DrawerHeader(props: DrawerHeaderProps) {
  const { t } = useTranslation();
  const {
    title,
    actions,
    closeLabel = t("ui.common.close", "Close"),
    hideClose,
    className,
  } = props;
  return (
    <div className={cx(headerStyles, className)}>
      <BaseDrawer.Title
        render={<Text variant="h2" />}
        className={css({ minWidth: 0 })}
      >
        {title}
      </BaseDrawer.Title>
      <div className={css({ display: "flex", gap: "1", flex: "none" })}>
        {actions}
        {!hideClose && (
          <BaseDrawer.Close
            render={
              <IconButton label={closeLabel} tooltipSide="bottom">
                <XIcon />
              </IconButton>
            }
          />
        )}
      </div>
    </div>
  );
}
