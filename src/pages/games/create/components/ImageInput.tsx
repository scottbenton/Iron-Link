import { ButtonBase } from "@mui/material";
import { useEffect, useState } from "react";

import { PortraitUploaderDialog } from "components/PortraitUploaderDialog";
import { PortraitAvatarDisplay } from "components/characters/PortraitAvatar";

import { CharacterPortraitSettings } from "stores/createCharacter.store";

export interface ImageInputProps {
  characterName: string;
  value: CharacterPortraitSettings;
  onChange: (value: CharacterPortraitSettings) => void;
}

export function ImageInput(props: ImageInputProps) {
  const { characterName, value, onChange } = props;

  const [dialogOpen, setDialogOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState<string>();

  const file = value?.image;
  useEffect(() => {
    if (file && typeof file !== "string") {
      const reader = new FileReader();

      // Set up a function to run when the file is loaded
      reader.onload = (e: ProgressEvent<FileReader>) => {
        // Set the src attribute of the img element to the loaded image data
        const src = e.target?.result;
        if (typeof src === "string") {
          setImageUrl(src);
        }
      };

      // Read the selected file as a data URL
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <div>
      <ButtonBase
        aria-label={"Upload a Character Portrait"}
        sx={(theme) => ({
          borderRadius: `${theme.shape.borderRadius}px`,
        })}
        onClick={() => setDialogOpen(true)}
      >
        <PortraitAvatarDisplay
          size={"large"}
          name={characterName}
          portraitUrl={imageUrl}
          portraitSettings={
            value?.position && value?.scale !== undefined
              ? {
                  position: value.position,
                  scale: value.scale,
                }
              : undefined
          }
        />
      </ButtonBase>
      <PortraitUploaderDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        handleUpload={(image, scale, position) => {
          onChange({
            image: typeof image === "string" ? null : image,
            scale,
            position,
          });
          return new Promise<void>((res) => res());
        }}
        existingPortraitFile={undefined}
        existingPortraitSettings={undefined}
      />
    </div>
  );
}
