import { IconBase, IconProps, IconWeight } from "@phosphor-icons/react";
import { ReactElement, forwardRef } from "react";

/**
 * Phosphor's ImageSquare with a slash through it, for "Remove image" (MUI's
 * HideImage). Phosphor has no slashed image, and its broken image reads as an
 * error rather than an action. Drawn on Phosphor's 256 grid, the slash as
 * wide as each weight's own lines, with a gap cut where it crosses the image.
 * Duotone draws the regular weight.
 */
function slashed(weight: IconWeight, stroke: number, d: string) {
  const maskId = `ui-image-slash-gap-${weight}`;
  return (
    <>
      <mask id={maskId}>
        <rect width="256" height="256" fill="white" />
        <line
          x1="36"
          y1="36"
          x2="220"
          y2="220"
          stroke="black"
          strokeWidth={stroke + 24}
          strokeLinecap="round"
        />
      </mask>
      <path d={d} mask={`url(#${maskId})`} />
      <line
        x1="36"
        y1="36"
        x2="220"
        y2="220"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </>
  );
}

const weights = new Map<IconWeight, ReactElement>([
  [
    "thin",
    slashed(
      "thin",
      8,
      "M208,36H48A12,12,0,0,0,36,48V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V48A12,12,0,0,0,208,36ZM44,208V48a4,4,0,0,1,4-4H208a4,4,0,0,1,4,4v87l-31.51-31.52a12,12,0,0,0-17,0L55,212H48A4,4,0,0,1,44,208Zm164,4H66.34L169.17,109.17a4,4,0,0,1,5.66,0L212,146.34V208A4,4,0,0,1,208,212ZM96,116A20,20,0,1,0,76,96,20,20,0,0,0,96,116Zm0-32A12,12,0,1,1,84,96,12,12,0,0,1,96,84Z",
    ),
  ],
  [
    "light",
    slashed(
      "light",
      12,
      "M208,34H48A14,14,0,0,0,34,48V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V48A14,14,0,0,0,208,34ZM46,208V48a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2v82.2l-28.1-28.1a14,14,0,0,0-19.8,0L54.2,210H48A2,2,0,0,1,46,208Zm162,2H71.17l99.41-99.41a2,2,0,0,1,2.83,0L210,147.17V208A2,2,0,0,1,208,210ZM96,118A22,22,0,1,0,74,96,22,22,0,0,0,96,118Zm0-32A10,10,0,1,1,86,96,10,10,0,0,1,96,86Z",
    ),
  ],
  [
    "regular",
    slashed(
      "regular",
      16,
      "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,48H208v77.38l-24.69-24.7a16,16,0,0,0-22.62,0L53.37,208H48ZM208,208H76l96-96,36,36v60ZM96,120A24,24,0,1,0,72,96,24,24,0,0,0,96,120Zm0-32a8,8,0,1,1-8,8A8,8,0,0,1,96,88Z",
    ),
  ],
  [
    "bold",
    slashed(
      "bold",
      24,
      "M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28Zm-4,24v63.72L186.14,97.86a20,20,0,0,0-28.28,0L52,203.72V52ZM85.66,204,172,117.66l32,32V204ZM76,96a20,20,0,1,1,20,20A20,20,0,0,1,76,96Z",
    ),
  ],
  [
    "fill",
    slashed(
      "fill",
      16,
      "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,48H208v77.38l-24.69-24.7a16,16,0,0,0-22.62,0L53.37,208H48ZM80,96a16,16,0,1,1,16,16A16,16,0,0,1,80,96Z",
    ),
  ],
]);
weights.set("duotone", weights.get("regular")!);

export const ImageSlashIcon = forwardRef<SVGSVGElement, IconProps>(
  (props, ref) => <IconBase ref={ref} {...props} weights={weights} />,
);
ImageSlashIcon.displayName = "ImageSlashIcon";
