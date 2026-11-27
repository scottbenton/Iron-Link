import { Trans } from "react-i18next";

import { Link } from "ui/components/Link";
import { Text } from "ui/components/Text";

import { IPackageConfig } from "data/package.config";

export interface LicenseInfoProps {
  packageConfig: IPackageConfig;
}

/** A third-party package's author and license, under its checkbox. */
export function LicenseInfo(props: LicenseInfoProps) {
  const { packageConfig } = props;

  if (!packageConfig.isHomebrew || !packageConfig.licenseInfo) {
    return null;
  }
  const { author, url, license, licenseUrl } = packageConfig.licenseInfo;

  return (
    <Text variant="bodySm" color="muted" css={{ paddingInlineStart: "8" }}>
      <Trans
        i18nKey="ruleset-selector.license-info"
        defaults="<author>{{author}}</author> (<license>{{license}}</license>)"
        values={{ author, license }}
        components={{
          author: <Link href={url} external />,
          license: <Link href={licenseUrl} color="muted" external />,
        }}
      />
    </Text>
  );
}
