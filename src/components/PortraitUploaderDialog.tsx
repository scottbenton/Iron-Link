import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { ChangeEventHandler, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider/useSnackbar";

import { ImageCropper } from "components/ImageCropper";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

export interface PortraitUploaderDialogProps {
  open: boolean;
  handleClose: () => void;
  handleUpload: (
    image: File | string,
    scale: number,
    position: { x: number; y: number },
  ) => Promise<void>;
  existingPortraitFile?: File | string;
  existingPortraitSettings?: {
    position: {
      x: number;
      y: number;
    };
    scale: number;
  };
}

export function PortraitUploaderDialog(props: PortraitUploaderDialogProps) {
  const {
    open,
    handleClose,
    handleUpload,
    existingPortraitFile,
    existingPortraitSettings,
  } = props;
  const { t } = useTranslation();
  const { error } = useSnackbar();

  const [loading, setLoading] = useState<boolean>(false);
  const [file, setFile] = useState<File | string | undefined>(
    existingPortraitFile,
  );

  const [scale, setScale] = useState<number>(
    existingPortraitSettings?.scale ?? 1,
  );
  const [position, setPosition] = useState<{ x: number; y: number }>(
    existingPortraitSettings?.position ?? {
      x: 0.5,
      y: 0.5,
    },
  );

  const handleFileInputChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const files = evt.currentTarget.files;

    if (files && files.length > 0) {
      if (files[0].size > MAX_FILE_SIZE) {
        error(
          `File is too large. The max file size is ${MAX_FILE_SIZE_LABEL}.`,
        );
        evt.target.value = "";
        return;
      }
      setFile(files[0]);
    }
  };

  const onUpload = () => {
    if (file) {
      setLoading(true);
      handleUpload(file, scale, position)
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          handleClose();
        });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Upload Portrait
        <Box>
          <IconButton
            aria-label={t("common.close-dialog", "Close Dialog")}
            onClick={() => handleClose()}
            disabled={loading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Button variant="outlined" component="label" color={"inherit"}>
          {file ? "Change Image" : "Upload Image"}
          <input
            hidden
            accept="image/*"
            multiple
            type="file"
            onChange={handleFileInputChange}
          />
        </Button>
        {file && (
          <Box display={"flex"} flexDirection={"column"} mt={1}>
            <ImageCropper
              image={file}
              crop={{ position, scale }}
              onChange={(crop) => {
                setPosition(crop.position);
                setScale(crop.scale);
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          color={"inherit"}
          onClick={() => handleClose()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant={"contained"}
          onClick={() => onUpload()}
          disabled={loading}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
