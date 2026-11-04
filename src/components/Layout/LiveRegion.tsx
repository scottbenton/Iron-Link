import { ScreenReaderOnly } from "components/ScreenReaderOnly";

import { useLiveRegionText } from "./useLiveRegionText";

export interface LiveRegionProps {
  id?: string;
}

/**
 * Reads announcements (roll and oracle results, track changes) to screen
 * readers. A modal dialog hides the rest of the page from them, this region
 * included, so dialogs render one of their own.
 */
export function LiveRegion(props: LiveRegionProps) {
  const { id } = props;
  const text = useLiveRegionText();

  return (
    <ScreenReaderOnly live id={id}>
      {text}
    </ScreenReaderOnly>
  );
}
