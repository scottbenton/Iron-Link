import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { ComponentProps } from "react";

export interface PreviewCardTriggerProps
  extends Omit<ComponentProps<typeof BasePreviewCard.Trigger>, "className"> {
  className?: string;
}

/** The link that shows the preview. Pass a router link through `render`. */
export const PreviewCardTrigger = BasePreviewCard.Trigger as (
  props: PreviewCardTriggerProps,
) => ReturnType<typeof BasePreviewCard.Trigger>;
