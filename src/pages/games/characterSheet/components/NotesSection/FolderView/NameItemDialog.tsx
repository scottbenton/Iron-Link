import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { i18n } from "i18n/config";

export interface NameItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  name: string;
  itemLabel: string;
}

const resolver: Resolver<{ name: string }> = async (values) => {
  return {
    values,
    errors: !values.name.trim()
      ? {
          name: {
            type: "required",
            message: i18n.t("common.required", "This field is required"),
          },
        }
      : {},
  };
};

export function NameItemDialog(props: NameItemDialogProps) {
  const { open, onClose, onSave, name, itemLabel } = props;

  const { t } = useTranslation();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({ resolver });
  const onSubmit = handleSubmit((data) => {
    onSave(data.name);
    onClose();
  });

  useEffect(() => {
    if (open) {
      reset({ name });
    }
  }, [name, open, reset]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("notes.name-item-dialog.title", "{{itemLabel}} Name", {
          itemLabel,
        })}
      </DialogTitleWithCloseButton>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("notes.name-item-dialog.input-label", "Name")}
            fullWidth
            slotProps={{
              htmlInput: {
                ...register("name"),
              },
            }}
            error={!!errors?.name}
            helperText={errors?.name?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} color="inherit">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" variant="contained">
            {t("common.save", "Save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
