import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  CharacterPortrait,
  PortraitPlaceholder,
} from "ui/game/CharacterPortrait";
import { CameraIcon } from "ui/icons";
import { Stack } from "ui/primitives";

import { CharacterPortraitSettings } from "stores/createCharacter.store";

import { PortraitUploaderDialog } from "./PortraitUploaderDialog";

export interface ImageInputProps {
  characterName: string;
  value: CharacterPortraitSettings;
  onChange: (value: CharacterPortraitSettings) => void;
}

// The new character's portrait: an empty portrait to press for adding one,
// or the chosen portrait with a button to change it.
export function ImageInput(props: ImageInputProps) {
  const { characterName, value, onChange } = props;
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);
  // Each opening starts the dialog from the current portrait.
  const [dialogKey, setDialogKey] = useState(0);
  const openDialog = () => {
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const file = value.image ?? undefined;
  const [imageUrl, setImageUrl] = useState<string>();
  useEffect(() => {
    if (!file) {
      setImageUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const crop =
    value.position && value.scale !== undefined
      ? { position: value.position, scale: value.scale }
      : undefined;

  return (
    <>
      {imageUrl ? (
        <Stack alignItems="center" gap="1">
          <CharacterPortrait
            name={characterName}
            portraitUrl={imageUrl}
            crop={crop}
            size="xl"
            decorative
          />
          <Button
            size="sm"
            variant="ghost"
            startIcon={<CameraIcon />}
            onClick={openDialog}
          >
            {t("character.create.change-portrait", "Change Portrait")}
          </Button>
        </Stack>
      ) : (
        <PortraitPlaceholder
          size="xl"
          label={t("character.create.add-portrait", "Add Portrait")}
          onClick={openDialog}
        />
      )}
      <PortraitUploaderDialog
        key={dialogKey}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUpload={(image, nextCrop) =>
          onChange({
            image,
            scale: nextCrop.scale,
            position: nextCrop.position,
          })
        }
        initialImage={file}
        initialCrop={crop}
      />
    </>
  );
}
