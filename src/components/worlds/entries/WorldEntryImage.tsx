import { Box } from "@mui/material";
import { useState } from "react";

import {
  DEFAULT_IMAGE_CROP,
  ImageCrop,
  getImageCropBox,
} from "lib/imageCrop.lib";

// An entry's image in a square, showing the part its crop chose. Until the
// image loads its size is unknown, so it shows the centre, as it always did
// before crops. Decorative: the entry's name always sits beside it.
export function WorldEntryImage({
  url,
  crop,
  size,
}: {
  url: string;
  crop: ImageCrop | null;
  size: number;
}) {
  const [natural, setNatural] = useState<{
    url: string;
    width: number;
    height: number;
  }>();
  const loaded = natural?.url === url ? natural : undefined;
  const box = loaded
    ? getImageCropBox(crop ?? DEFAULT_IMAGE_CROP, loaded.width, loaded.height)
    : undefined;

  return (
    <Box
      className="world-entry-image"
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Box
        component="img"
        alt=""
        src={url}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          setNatural({ url, width: naturalWidth, height: naturalHeight });
        }}
        sx={
          box
            ? {
                position: "absolute",
                left: `${box.left}%`,
                top: `${box.top}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                maxWidth: "none",
              }
            : {
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }
        }
      />
    </Box>
  );
}
