import LockIcon from "@mui/icons-material/Lock";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

// The lock on an entry only Guides can see, in a guided world.
export function WorldEntryGuidesOnlyIcon() {
  const { t } = useTranslation();
  const label = t(
    "worlds.entries.guides-only-entry",
    "Only Guides can see this entry",
  );
  return (
    <Tooltip title={label}>
      <LockIcon
        role="img"
        aria-label={label}
        aria-hidden={false}
        fontSize="small"
        sx={{ color: "text.disabled", fontSize: 16 }}
      />
    </Tooltip>
  );
}
