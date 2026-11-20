import { IconBase } from "@phosphor-icons/react";
import type { IconWeight, Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ReactElement, forwardRef, isValidElement } from "react";

/**
 * What a custom icon draws: one drawing for every weight, or a drawing per
 * weight where any weight left out uses `regular`.
 */
export type IconDrawing =
  | ReactElement
  | ({ regular: ReactElement } & Partial<Record<IconWeight, ReactElement>>);

const allWeights: IconWeight[] = [
  "thin",
  "light",
  "regular",
  "bold",
  "fill",
  "duotone",
];

/**
 * Makes an icon of our own that works anywhere a Phosphor icon does: in
 * `<Icon icon={...} />`, a `Button`'s `startIcon` or an `IconButton`.
 *
 * Draw it on Phosphor's 256 unit grid, in `currentColor` (shapes inherit
 * Phosphor's `fill="currentColor"`; give lines `stroke="currentColor"`), with
 * Phosphor's line widths: thin 8, light 12, regular 16, bold 24.
 *
 * ```tsx
 * export const RuneIcon = createIcon("RuneIcon", {
 *   regular: <path d="..." />,
 *   bold: <path d="..." />,
 * });
 * ```
 *
 * Add the result to `ui/icons/index.ts` so screens import it with the rest.
 */
export function createIcon(name: string, drawing: IconDrawing): PhosphorIcon {
  const byWeight = isValidElement(drawing) ? { regular: drawing } : drawing;
  const weights = new Map<IconWeight, ReactElement>(
    allWeights.map((weight) => [weight, byWeight[weight] ?? byWeight.regular]),
  );
  const CustomIcon: PhosphorIcon = forwardRef((props, ref) => (
    <IconBase ref={ref} {...props} weights={weights} />
  ));
  CustomIcon.displayName = name;
  return CustomIcon;
}
