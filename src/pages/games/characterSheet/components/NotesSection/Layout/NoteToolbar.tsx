import { PropsWithChildren } from "react";

import { ActionToolbar } from "components/Layout/ActionToolbar";

import { NoteBreadcrumbs } from "./NoteBreadcrumbs";

export function NoteToolbar(props: PropsWithChildren) {
  const { children } = props;

  return (
    <ActionToolbar breadcrumbs={<NoteBreadcrumbs />}>{children}</ActionToolbar>
  );
}
