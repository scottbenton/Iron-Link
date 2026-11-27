import { Trans, useTranslation } from "react-i18next";

import { Link } from "ui/components/Link";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

const GITHUB_URL = "https://github.com/scottbenton/Iron-Link";
const IRONSWORN_URL = "https://www.ironswornrpg.com";
const LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/";

export function LicensingFooter() {
  const { t } = useTranslation();

  return (
    <Stack
      as="footer"
      gap="1"
      paddingBlockStart="4"
      borderTop="1px solid"
      borderColor="border.default"
    >
      <Text variant="caption" as="p" color="muted">
        <Trans
          i18nKey="home.footer.open-source"
          defaults="Iron Link is free and <githubLink>open source</githubLink>."
          components={{
            githubLink: <Link href={GITHUB_URL} color="inherit" external />,
          }}
        />
      </Text>
      <Text variant="caption" as="p" color="muted">
        <Trans
          i18nKey="home.footer.licensing"
          defaults="This work is based on <ironswornLink>Ironsworn and Ironsworn: Starforged</ironswornLink>, created by Shawn Tomkin, and licensed for our use under the <licenseLink>Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license</licenseLink>."
          components={{
            ironswornLink: (
              <Link href={IRONSWORN_URL} color="inherit" external />
            ),
            licenseLink: <Link href={LICENSE_URL} color="inherit" external />,
          }}
        />
      </Text>
      <Text variant="caption" as="p" color="muted">
        {t(
          "home.footer.thanks",
          "Thank you to Shawn Tomkin for the permissive licensing, and to the Datasworn project for the structured rules data this app is built on.",
        )}
      </Text>
    </Stack>
  );
}
