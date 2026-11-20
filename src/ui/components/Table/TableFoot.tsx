import { ComponentProps } from "react";

export function TableFoot(props: ComponentProps<"tfoot">) {
  const { className, ...rest } = props;
  return <tfoot className={className} {...rest} />;
}
