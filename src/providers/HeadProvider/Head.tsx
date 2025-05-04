import { useTranslation } from "react-i18next";

export interface HeadProps {
  title: string;
  description?: string;
  openGraphImageSrc?: string;
}

export function Head(props: HeadProps) {
  const { title, description, openGraphImageSrc } = props;

  const { t } = useTranslation();
  const appName = t("iron-link.title", "Iron Link");
  return (
    <>
      <title>
        {title} | {appName}
      </title>
      <meta property="og:title" content={`${title} | ${appName}`} />
      {description && <meta property="og:description" content={description} />}
      {openGraphImageSrc && (
        <>
          <meta property="og:image" content={openGraphImageSrc} />
          <meta property="og:image:secure_url" content={openGraphImageSrc} />
          <meta property="twitter:image" content={openGraphImageSrc} />
        </>
      )}
    </>
  );
}
