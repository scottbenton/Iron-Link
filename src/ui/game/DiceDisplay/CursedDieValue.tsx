import { Skull } from "@phosphor-icons/react";

import { css } from "styled-system/css";

export function CursedDieValue(props: { value: number }) {
  return props.value === 10 ? (
    <Skull weight="fill" aria-hidden className={css({ display: "block" })} />
  ) : (
    props.value
  );
}
