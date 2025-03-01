import { CharacterPortraitSettings } from "@/stores/createCharacter.store";
import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";

// import { PortraitUploaderDialog } from "~/components/PortraitUploaderDialog";

import { PortraitAvatarDisplay } from "../PortraitAvatar";
import { PortraitUploaderDialog } from "./PortraitUploaderDialog";

export interface ImageInputProps {
  characterName: string;
  value: CharacterPortraitSettings;
  onChange: (value: CharacterPortraitSettings) => void;
}

export function ImageInput(props: ImageInputProps) {
  const { characterName, value, onChange } = props;

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
      <PortraitUploaderDialog
        trigger={
          <Box
            as="button"
            borderRadius={"md"}
            aria-label={"Upload a Character Portrait"}
            cursor="pointer"
            css={{
              "&>div": {
                transitionProperty: "background-color",
                transitionTimingFunction: "ease-in-out",
                transitionDuration: "fast",
              },
            }}
            _hover={{
              "&>div": {
                bgColor: "bg.emphasized",
              },
            }}
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
          </Box>
        }
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
