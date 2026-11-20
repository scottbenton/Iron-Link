import type { DieShape } from "./Die";

export function DieShapeSvg(props: { shape: DieShape; ring: boolean }) {
  const { shape, ring } = props;
  if (shape === "d10") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden focusable="false">
        {ring && (
          <polygon
            data-ring=""
            points="16,-3 34.5,11 34.5,21 16,35 -2.5,21 -2.5,11"
          />
        )}
        <polygon
          data-face=""
          points="16,1.5 30.5,12.5 30.5,19.5 16,30.5 1.5,19.5 1.5,12.5"
        />
      </svg>
    );
  }
  const width = shape === "d100" ? 43 : 32;
  return (
    <svg
      viewBox={`0 0 ${width} 32`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      {ring && (
        <rect
          data-ring=""
          x="-2.5"
          y="-2.5"
          width={width + 5}
          height="37"
          rx="10"
        />
      )}
      <rect data-face="" x="1" y="1" width={width - 2} height="30" rx="7" />
    </svg>
  );
}
