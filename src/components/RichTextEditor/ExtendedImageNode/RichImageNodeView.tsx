import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { DragEvent, useRef, useState } from "react";

import { Box } from "ui/primitives";

import { useImageDisplaySrc } from "../secrets/guideImages";
import { AltTextDialog } from "./AltTextDialog";
import { ImageNodeToolbar } from "./ImageNodeToolbar";
import { ImageResizeHandles } from "./ImageResizeHandles";
import { getNoteImageLayout, noteImagePlacementStyles } from "./imageLayout";
import { useImageSecondScreen } from "./useImageSecondScreen";

export function RichImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected, editor } = props;
  const isReadOnly = !editor.isEditable;

  const { src, altText, width } = node.attrs;
  const { alignment, textWrapping } = getNoteImageLayout(node.attrs);
  const wrap = textWrapping === "wrap-text" ? "" : undefined;

  // Screen readers read the alt text; an image without any is skipped as
  // decoration rather than read as its file name.
  const imageAlt = typeof altText === "string" ? altText : "";

  // An image inside a secret shows through a signed URL.
  const displaySrc = useImageDisplaySrc(src);
  const secondScreen = useImageSecondScreen(src, imageAlt);

  const columnRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // The width while a resize handle is dragged, saved when it is let go.
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [altTextDialogOpen, setAltTextDialogOpen] = useState(false);

  if (isReadOnly) {
    return (
      <NodeViewWrapper>
        <Box
          data-alignment={alignment}
          data-wrap={wrap}
          display="flex"
          maxWidth="100%"
          borderRadius="sm"
          overflow="hidden"
          css={{ ...noteImagePlacementStyles, "& > img": { width: "100%" } }}
          style={{ width: width ?? undefined }}
        >
          <img src={displaySrc} alt={imageAlt} />
        </Box>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper ref={columnRef}>
      <Box
        ref={frameRef}
        data-corner-handles=""
        data-alignment={alignment}
        data-wrap={wrap}
        data-selected={selected ? "" : undefined}
        // The browser's own image drag would drop a copy of the image.
        onDragStart={(event: DragEvent) => event.preventDefault()}
        position="relative"
        display="flex"
        minWidth="50px"
        maxWidth="100%"
        boxSizing="border-box"
        borderRadius="sm"
        // Not clipped, so the corner handles draw over the border.
        css={{
          ...noteImagePlacementStyles,
          border: "2px solid transparent",
          transition: "border-color token(durations.fast) linear",
          "&[data-selected]": { borderColor: "accent.solid" },
          "& > img": {
            width: "100%",
            objectFit: "contain",
            borderRadius: "2px",
          },
        }}
        style={{ width: previewWidth ?? width ?? "100%" }}
      >
        <img src={displaySrc} alt={imageAlt} draggable={false} />
        <ImageResizeHandles
          alignment={alignment}
          visible={selected}
          imageRef={frameRef}
          columnRef={columnRef}
          onPreview={setPreviewWidth}
          onResize={(newWidth) => updateAttributes({ width: newWidth })}
        />
        {selected && (
          <ImageNodeToolbar
            alignment={alignment}
            textWrapping={textWrapping}
            onAlignmentChange={(value) =>
              updateAttributes({ alignment: value })
            }
            onTextWrappingChange={(value) =>
              updateAttributes({ textWrapping: value })
            }
            onEditAltText={() => setAltTextDialogOpen(true)}
            secondScreen={secondScreen.available ? secondScreen : undefined}
          />
        )}
        <AltTextDialog
          open={altTextDialogOpen}
          altText={imageAlt}
          onClose={() => setAltTextDialogOpen(false)}
          onSave={(value) => updateAttributes({ altText: value })}
        />
      </Box>
    </NodeViewWrapper>
  );
}
