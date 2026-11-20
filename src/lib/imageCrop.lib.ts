// The part of an image shown in a square: its centre as a fraction of the
// image's width and height, and a zoom of 1 or more. At zoom 1 the image's
// shorter side fills the square. This is the shape react-avatar-editor uses,
// and the one character portraits and world entry images store.
export interface ImageCrop {
  position: { x: number; y: number };
  scale: number;
}

export const DEFAULT_IMAGE_CROP: ImageCrop = {
  position: { x: 0.5, y: 0.5 },
  scale: 1,
};

export const MIN_IMAGE_CROP_SCALE = 1;
export const MAX_IMAGE_CROP_SCALE = 2;

// The fraction of the image's width and height the square shows.
function getVisibleFraction(
  scale: number,
  imageWidth: number,
  imageHeight: number,
) {
  const zoom = Math.max(scale, MIN_IMAGE_CROP_SCALE);
  return {
    x: Math.min(1, imageHeight / imageWidth) / zoom,
    y: Math.min(1, imageWidth / imageHeight) / zoom,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Keeps the square inside the image. The editor lets a drag run past the
// edge and only clamps what it draws, and a zoom out can leave the centre
// too near an edge, so stored crops are clamped before they are shown.
export function clampImageCrop(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
): ImageCrop {
  const scale = clamp(crop.scale, MIN_IMAGE_CROP_SCALE, MAX_IMAGE_CROP_SCALE);
  if (!(imageWidth > 0) || !(imageHeight > 0)) {
    return { position: crop.position, scale };
  }
  const visible = getVisibleFraction(scale, imageWidth, imageHeight);
  return {
    position: {
      x: clamp(crop.position.x, visible.x / 2, 1 - visible.x / 2),
      y: clamp(crop.position.y, visible.y / 2, 1 - visible.y / 2),
    },
    scale,
  };
}

// Moves the centre by a share of the visible part, for arrow keys.
export function nudgeImageCrop(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
  direction: { x: number; y: number },
  step = 0.1,
): ImageCrop {
  const visible = getVisibleFraction(crop.scale, imageWidth, imageHeight);
  return clampImageCrop(
    {
      position: {
        x: crop.position.x + direction.x * visible.x * step,
        y: crop.position.y + direction.y * visible.y * step,
      },
      scale: crop.scale,
    },
    imageWidth,
    imageHeight,
  );
}

// Where the image goes inside the square, as percentages of the square's
// size, for an absolutely positioned image.
export function getImageCropBox(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
): { left: number; top: number; width: number; height: number } {
  const { position, scale } = clampImageCrop(crop, imageWidth, imageHeight);
  const visible = getVisibleFraction(scale, imageWidth, imageHeight);
  return {
    left: (0.5 - position.x / visible.x) * 100,
    top: (0.5 - position.y / visible.y) * 100,
    width: 100 / visible.x,
    height: 100 / visible.y,
  };
}
