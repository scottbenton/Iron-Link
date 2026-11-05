import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <Breadcrumbs
      aria-label={t("nav.breadcrumbs", "Breadcrumbs")}
      sx={{ mb: 2 }}
    >
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
