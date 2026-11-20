import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { cardStyles } from "../Popover/cardStyles";
import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";

type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
type Align = "start" | "center" | "end";

export interface PreviewCardContentProps {
  children: ReactNode;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  className?: string;
}

export function PreviewCardContent(props: PreviewCardContentProps) {
  const {
    children,
    side = "bottom",
    align = "center",
    sideOffset = 8,
    className,
  } = props;
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        className={popupPositionerStyles}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
      >
        <BasePreviewCard.Popup
          className={cx("ui-root", popupSurfaceStyles, cardStyles, className)}
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
