import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { ComponentProps } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

const fieldsetStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "1",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
});

export interface FieldsetProps
  extends Omit<ComponentProps<typeof BaseFieldset.Root>, "className">,
    CssProp {
  className?: string;
}

/** Groups related controls under one legend. */
export function Fieldset(props: FieldsetProps) {
  const { className, ...rest } = withCssProp(props);
  return (
    <BaseFieldset.Root className={cx(fieldsetStyles, className)} {...rest} />
  );
}
