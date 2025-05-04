import { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { useSyncFavIconWithColorScheme } from "./useSyncFavIconWithColorScheme";

export function HeadProvider(props: PropsWithChildren) {
  const { children } = props;

  // const pathname = useLocation().pathname;
  // const url = window.location.origin + pathname;

  const { t } = useTranslation();
  const appName = t("iron-link.title", "Iron Link");

  useSyncFavIconWithColorScheme();

  return (
    <>
      <>
        <title>{appName}</title>
        <meta property="og:site_name" content={appName} />
        <meta property="og:title" content={appName} />
        <link rel="icon" type="image/svg+xml" href={"/favicon.svg"} />
        <meta
          property="og:description"
          content={t(
            "iron-link.description",
            "A character sheet and campaign manager for players and guides playing Ironsworn or Starforged",
          )}
        />
        {/* <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={getPublicAssetPath("opengraph-default.png")}
        />
        <meta
          property="og:image:secure_url"
          content={getPublicAssetPath("opengraph-default.png")}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:image"
          content={getPublicAssetPath("opengraph-default.png")}
        /> */}
      </>
      {children}
    </>
  );
}
