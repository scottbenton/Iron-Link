import { Dialog } from "@/components/common/Dialog";
import { TextField } from "@/components/common/TextField";
import { toaster } from "@/components/ui/toaster";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "@/repositories/storage.repository";
import { useCharacterPortrait } from "@/stores/character.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Button, Group } from "@chakra-ui/react";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { ChangeEventHandler, useEffect, useState } from "react";
import AvatarEditor from "react-avatar-editor";

export interface CharacterDetailsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterDetailsDialog(props: CharacterDetailsDialogProps) {
  const { open, onClose } = props;

  const t = useGameTranslations();

  const characterId = useCharacterIdOptional();

  const initialName = useGameCharacter((character) => character?.name ?? "");
  const initialPortraitSettings = useGameCharacter(
    (character) => character?.profileImage,
  );

  const updateCharacterName = useGameCharactersStore(
    (state) => state.updateCharacterName,
  );
  const updateCharacterPortrait = useGameCharactersStore(
    (state) => state.updateCharacterPortrait,
  );
  const removeCharacterPortrait = useGameCharactersStore(
    (state) => state.removeCharacterPortrait,
  );

  const initialFileUrl = useCharacterPortrait(characterId ?? "").url;

  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(initialName);
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const [file, setFile] = useState<File | string | undefined>(initialFileUrl);
  const [scale, setScale] = useState<number>(
    initialPortraitSettings?.scale ?? 1,
  );
  const [position, setPosition] = useState<{ x: number; y: number }>(
    initialPortraitSettings?.position ?? {
      x: 0.5,
      y: 0.5,
    },
  );
  useEffect(() => {
    setScale(initialPortraitSettings?.scale ?? 1);
    setPosition(initialPortraitSettings?.position ?? { x: 0.5, y: 0.5 });
  }, [initialPortraitSettings]);

  useEffect(() => {
    setFile((prevFile) =>
      !prevFile || typeof prevFile === "string" ? initialFileUrl : prevFile,
    );
  }, [initialFileUrl]);

  const handleFileInputChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    handleClearFile();
    const files = evt.currentTarget.files;

    if (files && files.length > 0) {
      if (files[0].size > MAX_FILE_SIZE) {
        toaster.error({
          description: t(
            "common.file-size-error",
            "File is too large. The max file size is {{maxFileSize}}",
            {
              maxFileSize: MAX_FILE_SIZE_LABEL,
            },
          ),
        });
        evt.target.value = "";
        return;
      }
      setFile(files[0]);
    }
  };
  const handleClearFile = () => {
    setFile(undefined);
    setPosition({ x: 0.5, y: 0.5 });
    setScale(1);
  };

  const handleSave = () => {
    if (characterId) {
      setIsLoading(true);

      const promises: Promise<unknown>[] = [];
      if (name && name !== initialName) {
        promises.push(updateCharacterName(characterId, name));
      }
      if (
        file !== initialFileUrl ||
        scale !== initialPortraitSettings?.scale ||
        position !== initialPortraitSettings?.position
      ) {
        promises.push(
          updateCharacterPortrait(
            characterId,
            scale,
            position,
            typeof file === "string" ? undefined : file,
          ),
        );
      } else if (!file && initialPortraitSettings) {
        promises.push(removeCharacterPortrait(characterId));
      }

      Promise.all(promises)
        .then(() => {
          onClose();
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t(
        "character-settings.change-character-name-portrait",
        "Change Character Name and Portrait",
      )}
      content={
        <>
          <TextField
            label={t("character.name", "Name")}
            value={name}
            onChange={(value) => setName(value)}
          />
          <Box mt={2}>
            <Button variant="outline" as="label" colorPalette={"gray"}>
              {file
                ? t("character.character-sidebar.change-image", "Change Image")
                : t("character.character-sidebar.upload-image", "Upload Image")}
              <input
                hidden
                accept="image/*"
                multiple
                type="file"
                onChange={handleFileInputChange}
              />
            </Button>
            {file && (
              <Button
                variant={"outline"}
                color={"red"}
                ml={1}
                onClick={handleClearFile}
              >
                {t("character.character-sidebar.remove-image", "Remove Image")}
              </Button>
            )}
            {file && (
              <Box
                display={"flex"}
                flexDirection={"column"}
                alignItems={"center"}
                mt={1}
              >
                <AvatarEditor
                  width={200}
                  height={200}
                  image={file}
                  borderRadius={4}
                  scale={scale}
                  position={position}
                  onPositionChange={setPosition}
                />
                <Box display={"flex"} justifyContent={"flex-end"} mt={0.5}>
                  <Group attached colorPalette={"gray"}>
                    <Button
                      variant="outline"
                      disabled={scale <= 1}
                      onClick={() => setScale((prevScale) => prevScale - 0.1)}
                      aria-label={t("portrait-settings-zoom-out", "Zoom Out")}
                    >
                      <ZoomOutIcon />
                    </Button>
                    <Button
                      variant="outline"
                      disabled={scale >= 2}
                      onClick={() => setScale((prevScale) => prevScale + 0.1)}
                      aria-label={t("porrait-setings-zoom-in", "Zoom In")}
                    >
                      <ZoomInIcon />
                    </Button>
                  </Group>
                </Box>
              </Box>
            )}
          </Box>
        </>
      }
      actions={
        <>
          <Button
            colorPalette="gray"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {t("common.save-changes", "Save Changes")}
          </Button>
        </>
      }
    />
  );
}
