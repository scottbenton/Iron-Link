import { Box, ButtonBase, Dialog, Tooltip } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldIconPickerDialog } from "../WorldIconPickerDialog";
import { WorldEntryIcon } from "./WorldEntryIcon";

// The icon or portrait beside an entry's name. A portrait opens full size
// for everyone; an icon opens the icon picker for people who can edit.
export function WorldEntryHeaderIcon({
  entry,
  canEdit,
  onError,
}: {
  entry: IWorldEntry;
  canEdit: boolean;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);

  const hasImage = !!entry.imageFilename;
  if (!hasImage && !canEdit)
    return <WorldEntryIcon entry={entry} size="large" />;

  const label = hasImage
    ? t("worlds.entries.view-image", "View image")
    : t("worlds.entries.choose-icon", "Choose icon");
  return (
    <>
      <Tooltip title={label}>
        <ButtonBase
          aria-label={label}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          sx={(theme) => ({
            flexShrink: 0,
            borderRadius: 1,
            "&.Mui-focusVisible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          })}
        >
          <WorldEntryIcon entry={entry} size="large" />
        </ButtonBase>
      </Tooltip>
      {open && entry.imageFilename && (
        <Dialog open maxWidth="md" onClose={() => setOpen(false)}>
          <DialogTitleWithCloseButton onClose={() => setOpen(false)}>
            {entry.name}
          </DialogTitleWithCloseButton>
          <Box
            component="img"
            src={WorldEntriesService.getWorldEntryImageUrl(
              entry.worldId,
              entry.id,
              entry.imageFilename,
            )}
            alt={entry.name}
            sx={{ display: "block", maxWidth: "100%", maxHeight: "80vh" }}
          />
        </Dialog>
      )}
      {open && !entry.imageFilename && (
        <WorldIconPickerDialog
          value={entry.icon}
          title={t("worlds.entries.choose-icon-title", "Choose entry icon")}
          onSave={(icon) => {
            updateEntry(entry.id, { icon }).catch(onError);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
