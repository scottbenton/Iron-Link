import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { ButtonBase, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { IconDefinition } from "types/Icon.type";

import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { WorldCategoryIconDialog } from "./WorldCategoryIconDialog";
import { categoryIconName } from "./categoryIcons";

// The category's icon as a square tile. Clicking it opens the icon dialog.
export function WorldCategoryIconPicker({
  value,
  onChange,
  disabled,
}: {
  value: IconDefinition | null;
  onChange: (value: IconDefinition | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  const label = t("worlds.categories.choose-icon", "Choose category icon");
  return (
    <>
      <Tooltip title={value?.key ? categoryIconName(value.key) : label}>
        <span>
          <ButtonBase
            aria-label={label}
            disabled={disabled}
            onClick={() => setOpen(true)}
            sx={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              borderStyle: value?.key ? "solid" : "dashed",
              color: "text.secondary",
              overflow: "hidden",
              "&:hover, &.Mui-focusVisible": { borderColor: "text.primary" },
            }}
          >
            {value?.key ? (
              <WorldCategoryIcon icon={value} size="xlarge" />
            ) : (
              <AddPhotoAlternateOutlinedIcon />
            )}
          </ButtonBase>
        </span>
      </Tooltip>
      {open && !disabled && (
        <WorldCategoryIconDialog
          value={value}
          onSave={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
