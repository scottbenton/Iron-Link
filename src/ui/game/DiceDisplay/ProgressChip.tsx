import { ProgressGlyph } from "./ProgressGlyph";
import { chipTermStyles } from "./chipTermStyles";

export function ProgressChip(props: { value: number }) {
  return (
    <span className={chipTermStyles} data-tone="progress">
      <ProgressGlyph />
      {props.value}
    </span>
  );
}
