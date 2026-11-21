import { ReactNode } from "react";

import {
  trackCardDescriptionStyles,
  trackCardEyebrowStyles,
  trackCardHeadActionStyles,
  trackCardHeadStyles,
} from "./trackCardStyles";

export interface TrackCardHeaderProps {
  /** The line above the title (kind, rank, a Completed badge). */
  eyebrow?: ReactNode;
  /** The title element, already named for the card's control. */
  title: ReactNode;
  description?: string;
  /** A control at the top right, such as the card's menu. */
  action?: ReactNode;
}

/**
 * The head of a track or clock card. The action sits at the end of the
 * eyebrow's line, so the title below it takes the card's full width. With no
 * eyebrow it sits beside the title.
 */
export function TrackCardHeader(props: TrackCardHeaderProps) {
  const { eyebrow, title, description, action } = props;
  return (
    <div
      className={trackCardHeadStyles}
      data-eyebrow={eyebrow ? "" : undefined}
    >
      {eyebrow && (
        <p className={trackCardEyebrowStyles} data-area="eyebrow">
          {eyebrow}
        </p>
      )}
      {action && (
        <div className={trackCardHeadActionStyles} data-area="action">
          {action}
        </div>
      )}
      <div data-area="title">{title}</div>
      {description && (
        <p className={trackCardDescriptionStyles} data-area="description">
          {description}
        </p>
      )}
    </div>
  );
}
