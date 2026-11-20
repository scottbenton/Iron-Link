import { Flame } from "@phosphor-icons/react";

import { chipTermStyles } from "./chipTermStyles";

export function MomentumChip(props: { value: number }) {
  return (
    <span className={chipTermStyles} data-tone="momentum">
      <Flame weight="fill" aria-hidden />
      {props.value}
    </span>
  );
}
