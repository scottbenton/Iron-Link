import { Box, Link, Typography } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";

const GITHUB_URL = "https://github.com/scottbenton/Iron-Link";
const IRONSWORN_URL = "https://www.ironswornrpg.com";
const LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/";

export function LicensingFooter() {
  const { t } = useTranslation();

  return (
    <Box borderTop={1} borderColor="divider" pt={2}>
      <Typography variant="caption" component="p" color="text.secondary">
        <Trans
          i18nKey="home.footer.open-source"
          defaults="Iron Link is free and <githubLink>open source</githubLink>."
          components={{
            githubLink: (
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              />
            ),
          }}
        />
      </Typography>
      <Typography variant="caption" component="p" color="text.secondary">
        <Trans
          i18nKey="home.footer.licensing"
          defaults="This work is based on <ironswornLink>Ironsworn and Ironsworn: Starforged</ironswornLink>, created by Shawn Tomkin, and licensed for our use under the <licenseLink>Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International license</licenseLink>."
          components={{
            ironswornLink: (
              <Link
                href={IRONSWORN_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              />
            ),
            licenseLink: (
              <Link
                href={LICENSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              />
            ),
          }}
        />
      </Typography>
      <Typography variant="caption" component="p" color="text.secondary">
        {t(
          "home.footer.thanks",
          "Thank you to Shawn Tomkin for the permissive licensing, and to the Datasworn project for the structured rules data this app is built on.",
        )}
      </Typography>
    </Box>
  );
}
