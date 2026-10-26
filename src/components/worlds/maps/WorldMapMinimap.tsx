import { Box } from "@mui/material";
import { PointerEvent, useLayoutEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Camera, ViewSize, visibleBounds } from "lib/worldMap/camera";
import { WorldMapChunk } from "lib/worldMap/chunks";
import { Bounds, Point, WorldMapGrid, unionBounds } from "lib/worldMap/grid";
import { WORLD_MAP_BACKGROUND } from "lib/worldMap/terrain";

import { WorldMapBackgroundImage, drawMinimapCells } from "./drawWorldMap";

const WIDTH = 168;
const HEIGHT = 112;
const PADDING = 6;

// Everything on the map in miniature, with the part on screen outlined.
// Pressing or dragging on it moves the view there.
export function WorldMapMinimap({
  grid,
  chunks,
  background,
  bounds,
  camera,
  view,
  onCenter,
}: {
  grid: WorldMapGrid;
  chunks: WorldMapChunk[];
  background: WorldMapBackgroundImage | null;
  bounds: Bounds;
  camera: Camera;
  view: ViewSize;
  onCenter: (point: Point) => void;
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = visibleBounds(camera, view);
  // The frame holds the content and the view, rounded out so small pans do
  // not redraw it.
  const frame = useMemo(() => {
    const raw = unionBounds(bounds, visible)!;
    const step = Math.max(raw.maxX - raw.minX, raw.maxY - raw.minY) / 8 || 1;
    return {
      minX: Math.floor(raw.minX / step) * step,
      minY: Math.floor(raw.minY / step) * step,
      maxX: Math.ceil(raw.maxX / step) * step,
      maxY: Math.ceil(raw.maxY / step) * step,
    };
  }, [bounds, visible]);
  const scale = Math.min(
    (WIDTH - PADDING * 2) / Math.max(1, frame.maxX - frame.minX),
    (HEIGHT - PADDING * 2) / Math.max(1, frame.maxY - frame.minY),
  );
  const offsetX =
    (WIDTH - (frame.maxX - frame.minX) * scale) / 2 - frame.minX * scale;
  const offsetY =
    (HEIGHT - (frame.maxY - frame.minY) * scale) / 2 - frame.minY * scale;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = WORLD_MAP_BACKGROUND;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.setTransform(
      ratio * scale,
      0,
      0,
      ratio * scale,
      ratio * offsetX,
      ratio * offsetY,
    );
    if (background)
      ctx.drawImage(
        background.image,
        background.x,
        background.y,
        background.width,
        background.height,
      );
    if (grid !== "none") drawMinimapCells(ctx, grid, chunks, scale);
  }, [grid, chunks, background, scale, offsetX, offsetY]);

  const centerOn = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onCenter({
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    });
  };

  return (
    <Box
      aria-label={t("worlds.maps.minimap", "Minimap")}
      role="img"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        centerOn(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons) centerOn(event);
      }}
      sx={{
        position: "absolute",
        right: 8,
        bottom: 8,
        width: WIDTH,
        height: HEIGHT,
        borderRadius: 1,
        overflow: "hidden",
        border: 1,
        borderColor: "grey.700",
        boxShadow: 3,
        cursor: "pointer",
        touchAction: "none",
        display: { xs: "none", sm: "block" },
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT, display: "block" }}
      />
      <Box
        sx={{
          position: "absolute",
          left: visible.minX * scale + offsetX,
          top: visible.minY * scale + offsetY,
          width: (visible.maxX - visible.minX) * scale,
          height: (visible.maxY - visible.minY) * scale,
          border: 2,
          borderColor: "common.white",
          borderRadius: 0.5,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
