import { ComponentProps } from "react";

export function TableHead(props: ComponentProps<"thead">) {
  const { className, ...rest } = props;
  return <thead className={className} {...rest} />;
}
