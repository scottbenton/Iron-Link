import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { ComponentProps } from "react";

export type PreviewCardProps = ComponentProps<typeof BasePreviewCard.Root>;

/**
 * A preview shown when a link is hovered or focused, such as a world entry
 * mention. It only repeats what the link leads to, so it holds no controls.
 */
export function PreviewCard(props: PreviewCardProps) {
  return <BasePreviewCard.Root {...props} />;
}
