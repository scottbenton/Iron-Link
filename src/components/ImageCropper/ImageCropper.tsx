import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import { KeyboardEvent, useId, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import { useTranslation } from "react-i18next";

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
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box
        tabIndex={0}
        role="group"
        aria-label={t("common.image-cropper.label", "Image position")}
        aria-describedby={hintId}
        onKeyDown={handleKeyDown}
        sx={(theme) => ({
          display: "flex",
          borderRadius: 1,
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          "& canvas": { cursor: "grab", touchAction: "none" },
        })}
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
      <Box
        display="flex"
        justifyContent="flex-end"
        mt={0.5}
        width={CROPPER_SIZE}
      >
        <ButtonGroup variant="outlined">
          <Button
            color="inherit"
            disabled={crop.scale <= MIN_IMAGE_CROP_SCALE}
            onClick={() => zoom(-1)}
            aria-label={t("common.image-cropper.zoom-out", "Zoom out")}
          >
            <ZoomOutIcon />
          </Button>
          <Button
            color="inherit"
            disabled={crop.scale >= MAX_IMAGE_CROP_SCALE}
            onClick={() => zoom(1)}
            aria-label={t("common.image-cropper.zoom-in", "Zoom in")}
          >
            <ZoomInIcon />
          </Button>
        </ButtonGroup>
      </Box>
      <Typography
        id={hintId}
        variant="caption"
        color="text.secondary"
        textAlign="center"
        mt={1}
      >
        {t(
          "common.image-cropper.hint",
          "Drag the image or use the arrow keys to move it.",
        )}
      </Typography>
    </Box>
  );
}
