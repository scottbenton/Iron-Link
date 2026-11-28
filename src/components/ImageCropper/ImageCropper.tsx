import { KeyboardEvent, useId, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { useTranslation } from "react-i18next";

import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from "ui/icons";
import { Box, HStack, Stack } from "ui/primitives";
import { focusRing } from "ui/styles/focus";

import {
  ImageCrop,
  MAX_IMAGE_CROP_SCALE,
  MIN_IMAGE_CROP_SCALE,
  clampImageCrop,
  nudgeImageCrop,
} from "lib/imageCrop.lib";

const ZOOM_STEP = 0.1;
const CROPPER_SIZE = 200;

const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

export interface ImageCropperProps {
  image: File | string;
  crop: ImageCrop;
  onChange: (crop: ImageCrop) => void;
}

// Chooses the square part of an image to show: drag the image or use the
// arrow keys to move it, and zoom with the buttons or + and -. Character
// portraits and world entry images share it, and both store its crop.
export function ImageCropper(props: ImageCropperProps) {
  const { image, crop, onChange } = props;
  const { t } = useTranslation();
  const hintId = useId();
  const [size, setSize] = useState<{ width: number; height: number }>();

  const change = (next: ImageCrop) =>
    onChange(size ? clampImageCrop(next, size.width, size.height) : next);

  const zoom = (direction: 1 | -1) => {
    const scale = Math.round((crop.scale + direction * ZOOM_STEP) * 10) / 10;
    if (scale < MIN_IMAGE_CROP_SCALE || scale > MAX_IMAGE_CROP_SCALE) return;
    change({ ...crop, scale });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const arrow = ARROWS[event.key];
    if (arrow && size) {
      event.preventDefault();
      onChange(nudgeImageCrop(crop, size.width, size.height, arrow));
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      zoom(-1);
    }
  };

  return (
    <Stack alignItems="center" gap="2">
      <Box
        tabIndex={0}
        role="group"
        aria-label={t("common.image-cropper.label", "Image position")}
        aria-describedby={hintId}
        onKeyDown={handleKeyDown}
        display="flex"
        borderRadius="md"
        outline="none"
        css={{
          _focusVisible: focusRing.outset,
          "& canvas": { cursor: "grab", touchAction: "none" },
        }}
      >
        <AvatarEditor
          width={CROPPER_SIZE}
          height={CROPPER_SIZE}
          image={image}
          borderRadius={4}
          scale={crop.scale}
          position={crop.position}
          onLoadSuccess={({ resource }) => {
            if (resource) {
              setSize({
                width: resource.naturalWidth,
                height: resource.naturalHeight,
              });
            }
          }}
          onPositionChange={(position) => change({ ...crop, position })}
        />
      </Box>
      <HStack justifyContent="flex-end" gap="1" width={`${CROPPER_SIZE}px`}>
        <IconButton
          label={t("common.image-cropper.zoom-out", "Zoom out")}
          variant="outline"
          size="sm"
          disabled={crop.scale <= MIN_IMAGE_CROP_SCALE}
          onClick={() => zoom(-1)}
        >
          <MagnifyingGlassMinusIcon />
        </IconButton>
        <IconButton
          label={t("common.image-cropper.zoom-in", "Zoom in")}
          variant="outline"
          size="sm"
          disabled={crop.scale >= MAX_IMAGE_CROP_SCALE}
          onClick={() => zoom(1)}
        >
          <MagnifyingGlassPlusIcon />
        </IconButton>
      </HStack>
      <Text id={hintId} variant="caption" color="muted" align="center">
        {t(
          "common.image-cropper.hint",
          "Drag the image or use the arrow keys to move it.",
        )}
      </Text>
    </Stack>
  );
}
