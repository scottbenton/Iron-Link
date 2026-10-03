import { Breadcrumbs, Link, Typography } from "@mui/material";

import {
  LinkComponent,
  type NavigationLinkProps,
} from "components/LinkComponent";

export interface BreadcrumbItem {
  key: string;
  label: string;
  id?: string;
  linkProps?: NavigationLinkProps;
}

export function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs aria-label="Breadcrumbs" sx={{ mb: 2 }}>
      {items.map((item) =>
        item.linkProps ? (
          <Link
            key={item.key}
            id={item.id}
            component={LinkComponent}
            {...item.linkProps}
            color="text.primary"
            underline="hover"
            sx={{ overflowWrap: "anywhere" }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography key={item.key} color="text.secondary" aria-current="page">
            {item.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  );
}
