import { Box, Link, Typography } from "@mui/material";

import { IPackageConfig } from "data/package.config";

export interface LicenseInfoProps {
  packageConfig: IPackageConfig;
}

export function LicenseInfo(props: LicenseInfoProps) {
  const { packageConfig } = props;

  if (!packageConfig.isHomebrew || !packageConfig.licenseInfo) {
    return null;
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={1}>
      <Typography color="text.secondary" ml={4} variant="body2">
        <Link
          href={packageConfig.licenseInfo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {packageConfig.licenseInfo.author}
        </Link>{" "}
        (
        <Link
          color="text.secondary"
          href={packageConfig.licenseInfo.licenseUrl}
        >
          {packageConfig.licenseInfo.license}
        </Link>
        )
      </Typography>
    </Box>
  );
}
