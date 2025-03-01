import { DialogActionTrigger } from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "@/repositories/storage.repository";
import { Box, Button, Group, IconButton } from "@chakra-ui/react";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { ChangeEventHandler, ReactNode, useState } from "react";
import AvatarEditor from "react-avatar-editor";

import { Dialog } from "../Dialog";

export interface PortraitUploaderDialogProps {
  trigger: ReactNode;
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
    trigger,
    handleUpload,
    existingPortraitFile,
    existingPortraitSettings,
  } = props;

  const t = useCharacterCreateTranslations();

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
        toaster.error({
          description: t(
            "File is too large. The max file size is {{maxFileSize}}",
            { maxFileSize: MAX_FILE_SIZE_LABEL },
          ),
        });
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
        });
    }
  };

  return (
    <Dialog
      trigger={trigger}
      size="xs"
      title={t("upload-portrait", "Upload Portrait")}
      content={
        <>
          <Button as="label" variant="outline" colorPalette="gray">
            {file
              ? t("change-portrait-image-button", "Change Image")
              : t("upload-portrait-image-button", "Upload Image")}
            <input
              hidden
              accept="image/*"
              multiple
              type="file"
              onChange={handleFileInputChange}
            />
          </Button>
          {file && (
            <Box mt={2}>
              <AvatarEditor
                width={200}
                height={200}
                image={file}
                borderRadius={4}
                scale={scale}
                position={position}
                onPositionChange={setPosition}
              />
              <Group attached>
                <IconButton
                  borderTopRadius={"none"}
                  variant="outline"
                  colorPalette={"gray"}
                  disabled={scale <= 1}
                  onClick={() => setScale((prevScale) => prevScale - 0.1)}
                  aria-label={t("portrait-edit-zoom-out", "Zoom Out")}
                >
                  <ZoomOutIcon />
                </IconButton>
                <IconButton
                  borderTopRadius={"none"}
                  variant="outline"
                  colorPalette={"gray"}
                  disabled={scale >= 2}
                  onClick={() => setScale((prevScale) => prevScale + 0.1)}
                  aria-label={t("portrait-edit-zoom-in", "Zoom In")}
                >
                  <ZoomInIcon />
                </IconButton>
              </Group>
            </Box>
          )}
        </>
      }
      actions={
        <>
          <DialogActionTrigger asChild>
            <Button colorPalette={"gray"} disabled={loading}>
              {t("cancel", "Cancel", { ns: "common" })}
            </Button>
          </DialogActionTrigger>
          <DialogActionTrigger asChild>
            <Button onClick={() => onUpload()} disabled={loading}>
              {t("upload", "Upload", { ns: "common" })}
            </Button>
          </DialogActionTrigger>
        </>
      }
    />
  );
}
