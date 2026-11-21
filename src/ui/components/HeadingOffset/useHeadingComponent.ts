import { HeadingComponent } from "./headingLevel";
import { useHeadingLevel } from "./useHeadingLevel";

/** The element for a heading written at `level` in the surrounding surface. */
export function useHeadingComponent(level: number): HeadingComponent {
  return `h${useHeadingLevel(level)}`;
}
