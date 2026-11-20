import type { IconWeight } from "@phosphor-icons/react";

import { createIcon } from "./createIcon";

/*
 * Phosphor's ImageSquare with a slash through it, for "Remove image" (MUI's
 * HideImage). Phosphor has no slashed image, and its broken image reads as an
 * error rather than an action.
 *
 * Built the way Phosphor builds its own slashed icons (CalendarSlash,
 * EyeSlash): the slash runs from (48, 40) to (208, 216) at each weight's line
 * width. Lines below and left of it run into it; lines above and right of it
 * stop with round ends a set distance from its centre (32, or 40 at bold), so
 * the gap is on that side only. The cut ends sit where the frame's top and
 * right edges and the mountain's slope cross that distance; the sun lies
 * across the slash, so only its lower half is left. Duotone draws regular's
 * lines over ImageSquare's own tint, uncut, as Phosphor's duotones do.
 */

const slash = { x1: 48, y1: 40, x2: 208, y2: 216 };

/** The band above the slash, from its centre line out to the cut. */
const gapBands = {
  32: "7.64,-4.40 263.26,276.78 286.93,255.26 31.32,-25.92",
  40: "7.64,-4.40 263.26,276.78 292.85,249.87 37.24,-31.30",
  24: "7.64,-4.40 263.26,276.78 281.01,260.64 25.40,-20.54",
};

/** Where each cut line ends: frame top, frame right, mountain slope. */
const cutEnds = {
  32: [
    [91.25, 40],
    [216, 177.23],
    [158.6, 114.09],
  ],
  40: [
    [102.06, 40],
    [216, 165.34],
    [164.26, 108.43],
  ],
} as const;

function slashed(
  weight: IconWeight,
  width: number,
  gap: 32 | 40,
  imagePath: string,
) {
  const maskId = `ui-image-slash-${weight}`;
  return (
    <>
      <mask id={maskId}>
        <rect x="-16" y="-16" width="288" height="288" fill="white" />
        <polygon points={gapBands[gap]} fill="black" />
      </mask>
      <path d={imagePath} mask={`url(#${maskId})`} />
      {cutEnds[gap].map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={width / 2} />
      ))}
      <line
        {...slash}
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
      />
    </>
  );
}

const regular = slashed(
  "regular",
  16,
  32,
  "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,48H208v77.38l-24.69-24.7a16,16,0,0,0-22.62,0L53.37,208H48ZM208,208H76l96-96,36,36v60ZM96,120A24,24,0,1,0,72,96,24,24,0,0,0,96,120Zm0-32a8,8,0,1,1-8,8A8,8,0,0,1,96,88Z",
);

export const ImageSlashIcon = createIcon("ImageSlashIcon", {
  thin: slashed(
    "thin",
    8,
    32,
    "M208,36H48A12,12,0,0,0,36,48V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V48A12,12,0,0,0,208,36ZM44,208V48a4,4,0,0,1,4-4H208a4,4,0,0,1,4,4v87l-31.51-31.52a12,12,0,0,0-17,0L55,212H48A4,4,0,0,1,44,208Zm164,4H66.34L169.17,109.17a4,4,0,0,1,5.66,0L212,146.34V208A4,4,0,0,1,208,212ZM96,116A20,20,0,1,0,76,96,20,20,0,0,0,96,116Zm0-32A12,12,0,1,1,84,96,12,12,0,0,1,96,84Z",
  ),
  light: slashed(
    "light",
    12,
    32,
    "M208,34H48A14,14,0,0,0,34,48V208a14,14,0,0,0,14,14H208a14,14,0,0,0,14-14V48A14,14,0,0,0,208,34ZM46,208V48a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2v82.2l-28.1-28.1a14,14,0,0,0-19.8,0L54.2,210H48A2,2,0,0,1,46,208Zm162,2H71.17l99.41-99.41a2,2,0,0,1,2.83,0L210,147.17V208A2,2,0,0,1,208,210ZM96,118A22,22,0,1,0,74,96,22,22,0,0,0,96,118Zm0-32A10,10,0,1,1,86,96,10,10,0,0,1,96,86Z",
  ),
  regular,
  bold: slashed(
    "bold",
    24,
    40,
    "M208,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V48A20,20,0,0,0,208,28Zm-4,24v63.72L186.14,97.86a20,20,0,0,0-28.28,0L52,203.72V52ZM85.66,204,172,117.66l32,32V204ZM76,96a20,20,0,1,1,20,20A20,20,0,0,1,76,96Z",
  ),
  // As CalendarSlash's fill: the shape is cut from 8 to 24 above the slash's
  // centre, and the slash itself crosses the open sky.
  fill: (
    <>
      <mask id="ui-image-slash-fill">
        <rect x="-16" y="-16" width="288" height="288" fill="white" />
        <polygon points={gapBands[24]} fill="black" />
      </mask>
      <path
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,48H208v77.38l-24.69-24.7a16,16,0,0,0-22.62,0L53.37,208H48ZM80,96a16,16,0,1,1,16,16A16,16,0,0,1,80,96Z"
        mask="url(#ui-image-slash-fill)"
      />
      <line
        {...slash}
        stroke="currentColor"
        strokeWidth={16}
        strokeLinecap="round"
      />
    </>
  ),
  duotone: (
    <>
      <path
        d="M208,40H48a8,8,0,0,0-8,8V208a8,8,0,0,0,8,8h8.69L166.34,106.34a8,8,0,0,1,11.32,0L216,144.69V48A8,8,0,0,0,208,40ZM96,112a16,16,0,1,1,16-16A16,16,0,0,1,96,112Z"
        opacity="0.2"
      />
      {regular}
    </>
  ),
});
