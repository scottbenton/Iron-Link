import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import { Box, Button } from "@mui/material";
import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import {
  Camera,
  DEFAULT_CAMERA,
  ViewSize,
  fitCamera,
  mapToScreen,
  panBy,
  screenToMap,
  zoomAt,
} from "lib/worldMap/camera";
import { WorldMapChunk, chunkKey } from "lib/worldMap/chunks";
import { contentBounds, snapToGrid } from "lib/worldMap/content";
import { Cell, Point, WorldMapGrid, cellAt } from "lib/worldMap/grid";

import { WorldMapMinimap } from "./WorldMapMinimap";
import {
  ChunkCache,
  WorldMapBackgroundImage,
  drawWorldMap,
} from "./drawWorldMap";

export interface WorldMapPointerEvent {
  phase: "start" | "move" | "end" | "cancel";
  point: Point;
  // Undefined on a map without a grid.
  cell?: Cell;
  pointerType: string;
}

export interface WorldMapPinPlacement<T> {
  id: string;
  pin: T;
  // Where the pin sits, in map units and on screen.
  point: Point;
  screen: Point;
  scale: number;
  // Being dragged to a new spot.
  dragging: boolean;
  // Starts dragging the pin, from its own pointerdown. Does nothing unless
  // the map takes drops.
  startDrag: (event: React.PointerEvent<HTMLElement>) => void;
}

export interface WorldMapViewportProps<T> {
  grid: WorldMapGrid;
  chunks: WorldMapChunk[];
  hexFlowers: boolean;
  background: {
    url: string;
    x: number;
    y: number;
    width: number | null;
  } | null;
  pins: { id: string; pin: T; point: Point }[];
  // False until the map's cells and pins have loaded, so the first fit sees
  // all of them.
  ready: boolean;
  label: string;
  // With a tool, one pointer (one finger) uses it and two pan and zoom;
  // without one, dragging pans. A "tap" tool leaves dragging to pan and
  // hears only taps, as a single "end".
  toolActive?: boolean;
  toolMode?: "stroke" | "tap";
  onToolPointer?: (event: WorldMapPointerEvent) => void;
  // Cells outlined under the pointer while a tool is active.
  getHighlight?: (cell: Cell) => Cell[];
  // The cursor while a tool is active; a crosshair unless set.
  toolCursor?: string;
  // Where a dragged pin was let go, snapped to the grid.
  onPinDrop?: (id: string, point: Point) => void;
  // The background image's own size, once it has loaded.
  onBackgroundLoad?: (size: { width: number; height: number }) => void;
  renderPin: (placement: WorldMapPinPlacement<T>) => ReactNode;
  // Extra controls over the map, top left.
  overlay?: ReactNode;
  height?: number | string;
}

const ZOOM_STEP = 1.25;
const PAN_STEP = 64;

function getViewSize(element: HTMLElement | null): ViewSize {
  return {
    width: element?.clientWidth ?? 0,
    height: element?.clientHeight ?? 0,
  };
}

// The map canvas: infinite in every direction, drawn a chunk at a time for
// what is on screen. Wheel, pinch, keyboard and the minimap move the view;
// Back to the map fits everything again.
export function WorldMapViewport<T>(props: WorldMapViewportProps<T>) {
  const {
    grid,
    chunks,
    hexFlowers,
    background,
    pins,
    ready,
    label,
    toolActive = false,
    toolMode = "stroke",
    onToolPointer,
    getHighlight,
    toolCursor = "crosshair",
    onBackgroundLoad,
    onPinDrop,
    renderPin,
    overlay,
    height = "min(70vh, 640px)",
  } = props;
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef(new ChunkCache());
  const [view, setView] = useState<ViewSize>({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const [highlight, setHighlight] = useState<Cell[]>();

  // Background image
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    setImage(undefined);
    if (!background?.url) return;
    const img = new Image();
    let active = true;
    img.onload = () => active && setImage(img);
    img.src = background.url;
    return () => {
      active = false;
    };
  }, [background?.url]);
  const onBackgroundLoadRef = useRef(onBackgroundLoad);
  onBackgroundLoadRef.current = onBackgroundLoad;
  useEffect(() => {
    if (image?.naturalWidth)
      onBackgroundLoadRef.current?.({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
  }, [image]);
  const backgroundRect: WorldMapBackgroundImage | null = useMemo(() => {
    if (!background || !image || !image.naturalWidth) return null;
    const width = background.width ?? image.naturalWidth;
    return {
      image,
      x: background.x,
      y: background.y,
      width,
      height: (width * image.naturalHeight) / image.naturalWidth,
    };
  }, [background, image]);

  const chunkMap = useMemo(
    () => new Map(chunks.map((chunk) => [chunkKey(chunk), chunk])),
    [chunks],
  );
  const bounds = useMemo(
    () =>
      contentBounds(
        grid,
        chunks,
        pins.map((pin) => pin.point),
        backgroundRect,
      ),
    [grid, chunks, pins, backgroundRect],
  );
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  // Size
  useLayoutEffect(() => {
    const element = containerRef.current;
    setView(getViewSize(element));
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setView(getViewSize(element)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The first view: fit what is there once it has loaded (and its
  // background has loaded, since that sets its size).
  const fitted = useRef(false);
  const backgroundPending = !!background?.url && !image;
  useEffect(() => {
    if (fitted.current || !ready || backgroundPending || !view.width) return;
    fitted.current = true;
    setCamera(fitCamera(boundsRef.current, view));
  }, [ready, backgroundPending, view]);
  const fit = useCallback(
    () =>
      setCamera(
        fitCamera(boundsRef.current, getViewSize(containerRef.current)),
      ),
    [],
  );

  // Drawing, at most once a frame.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !view.width || !view.height) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(view.width * ratio);
    const height = Math.round(view.height * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const frame = requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      cacheRef.current.prune(chunkMap);
      drawWorldMap(
        ctx,
        view,
        ratio,
        camera,
        {
          grid,
          chunks: chunkMap,
          hexFlowers,
          background: backgroundRect,
          highlight: toolActive ? highlight : undefined,
        },
        cacheRef.current,
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [
    view,
    camera,
    grid,
    chunkMap,
    hexFlowers,
    backgroundRect,
    highlight,
    toolActive,
  ]);

  // Pointers: one uses the tool (or pans), two pan and pinch.
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<
    | { type: "tool" }
    | { type: "pan"; last: Point; tap?: Point }
    | { type: "pinch"; center: Point; distance: number }
    | null
  >(null);

  const localPoint = (event: { clientX: number; clientY: number }): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  };
  const toolEvent = (
    phase: WorldMapPointerEvent["phase"],
    screen: Point,
    pointerType: string,
  ): WorldMapPointerEvent => {
    const point = screenToMap(
      cameraRef.current,
      getViewSize(containerRef.current),
      screen,
    );
    return {
      phase,
      point,
      cell: grid === "none" ? undefined : cellAt(grid, point),
      pointerType,
    };
  };
  const pinchState = () => {
    const [a, b] = [...pointers.current.values()];
    return {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Pins and controls over the map handle their own pointers.
    if (event.target !== canvasRef.current) return;
    if (
      event.pointerType === "mouse" &&
      event.button !== 0 &&
      event.button !== 1
    )
      return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const screen = localPoint(event);
    pointers.current.set(event.pointerId, screen);
    if (pointers.current.size === 2) {
      // A second finger ends the stroke and starts a pinch.
      if (gesture.current?.type === "tool")
        onToolPointer?.(toolEvent("cancel", screen, event.pointerType));
      gesture.current = { type: "pinch", ...pinchState() };
      setHighlight(undefined);
    } else if (pointers.current.size === 1) {
      if (toolActive && toolMode === "tap" && event.button === 0) {
        gesture.current = { type: "pan", last: screen, tap: screen };
      } else if (toolActive && event.button === 0) {
        gesture.current = { type: "tool" };
        onToolPointer?.(toolEvent("start", screen, event.pointerType));
      } else {
        gesture.current = { type: "pan", last: screen };
      }
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const screen = localPoint(event);
    const held = pinDrag.current;
    if (held && held.pointerId === event.pointerId) {
      if (Math.hypot(screen.x - held.start.x, screen.y - held.start.y) > 4)
        held.moved = true;
      if (!held.moved) return;
      const point = snapToGrid(
        grid,
        screenToMap(
          cameraRef.current,
          getViewSize(containerRef.current),
          screen,
        ),
      );
      held.point = point;
      setDraggedPin({ id: held.id, point });
      return;
    }
    if (!pointers.current.has(event.pointerId)) {
      // Hovering with a mouse or pen outlines what the tool would touch.
      if (
        toolActive &&
        getHighlight &&
        grid !== "none" &&
        event.target === canvasRef.current
      ) {
        const { cell } = toolEvent("move", screen, event.pointerType);
        setHighlight(cell ? getHighlight(cell) : undefined);
      }
      return;
    }
    pointers.current.set(event.pointerId, screen);
    const current = gesture.current;
    if (!current) return;
    if (current.type === "tool") {
      const toolMove = toolEvent("move", screen, event.pointerType);
      if (getHighlight && toolMove.cell)
        setHighlight(getHighlight(toolMove.cell));
      onToolPointer?.(toolMove);
    } else if (current.type === "pan") {
      if (
        current.tap &&
        Math.hypot(screen.x - current.tap.x, screen.y - current.tap.y) > 6
      )
        current.tap = undefined;
      const dx = screen.x - current.last.x;
      const dy = screen.y - current.last.y;
      current.last = screen;
      setCamera((value) => panBy(value, dx, dy));
    } else if (pointers.current.size >= 2) {
      const next = pinchState();
      const size = getViewSize(containerRef.current);
      setCamera((value) =>
        zoomAt(
          panBy(
            value,
            next.center.x - current.center.x,
            next.center.y - current.center.y,
          ),
          size,
          next.center,
          next.distance / current.distance,
        ),
      );
      gesture.current = { type: "pinch", ...next };
    }
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const held = pinDrag.current;
    if (held && held.pointerId === event.pointerId) {
      pinDrag.current = null;
      setDraggedPin(undefined);
      if (held.moved) {
        // The pin's own click would follow; it is not a click.
        suppressClick.current = true;
        if (event.type !== "pointercancel") onPinDrop?.(held.id, held.point);
      }
      return;
    }
    if (!pointers.current.has(event.pointerId)) return;
    const screen = localPoint(event);
    pointers.current.delete(event.pointerId);
    const current = gesture.current;
    if (
      current?.type === "pan" &&
      current.tap &&
      pointers.current.size === 0 &&
      event.type !== "pointercancel"
    ) {
      onToolPointer?.(toolEvent("end", screen, event.pointerType));
    }
    if (current?.type === "tool") {
      onToolPointer?.(
        toolEvent(
          event.type === "pointercancel" ? "cancel" : "end",
          screen,
          event.pointerType,
        ),
      );
    }
    if (pointers.current.size === 1 && current?.type === "pinch") {
      // Lifting one of two fingers carries on panning with the other.
      const [last] = [...pointers.current.values()];
      gesture.current = { type: "pan", last };
    } else if (pointers.current.size === 0) {
      gesture.current = null;
    }
  };

  // Dragging a pin to a new spot.
  const pinDrag = useRef<{
    id: string;
    pointerId: number;
    start: Point;
    point: Point;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [draggedPin, setDraggedPin] = useState<{ id: string; point: Point }>();
  const startPinDrag = (
    id: string,
    point: Point,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (!onPinDrop || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    suppressClick.current = false;
    pinDrag.current = {
      id,
      pointerId: event.pointerId,
      start: localPoint(event),
      point,
      moved: false,
    };
  };

  // Wheel and trackpad pinch zoom around the pointer. React's wheel
  // listener is passive, so it cannot keep the page from scrolling.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const screen = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015));
      setCamera((value) => zoomAt(value, getViewSize(element), screen, factor));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const center = { x: view.width / 2, y: view.height / 2 };
    const moves: Record<string, () => Camera> = {
      ArrowLeft: () => panBy(camera, PAN_STEP, 0),
      ArrowRight: () => panBy(camera, -PAN_STEP, 0),
      ArrowUp: () => panBy(camera, 0, PAN_STEP),
      ArrowDown: () => panBy(camera, 0, -PAN_STEP),
      "+": () => zoomAt(camera, view, center, ZOOM_STEP),
      "=": () => zoomAt(camera, view, center, ZOOM_STEP),
      "-": () => zoomAt(camera, view, center, 1 / ZOOM_STEP),
      "0": () => fitCamera(bounds, view),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setCamera(move());
  };

  return (
    <Box
      ref={containerRef}
      role="application"
      aria-label={label}
      aria-roledescription={t("worlds.maps.roledescription", "map")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerLeave={() => !pointers.current.size && setHighlight(undefined)}
      sx={{
        position: "relative",
        height,
        minHeight: 320,
        overflow: "hidden",
        borderRadius: 1,
        bgcolor: "grey.900",
        touchAction: "none",
        userSelect: "none",
        cursor: toolActive ? toolCursor : "grab",
        "&:focus-visible": {
          outline: (theme) => `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        component="canvas"
        ref={canvasRef}
        aria-hidden="true"
        sx={{ display: "block", width: "100%", height: "100%" }}
      />
      {view.width > 0 &&
        pins.map((placement) => {
          const dragging = draggedPin?.id === placement.id;
          return renderPin({
            ...placement,
            screen: mapToScreen(
              camera,
              view,
              dragging ? draggedPin.point : placement.point,
            ),
            scale: camera.scale,
            dragging,
            startDrag: (event) =>
              startPinDrag(placement.id, placement.point, event),
          });
        })}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 1,
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        {overlay}
        <Button
          size="small"
          variant="contained"
          color="inherit"
          startIcon={<CenterFocusStrongIcon />}
          onClick={fit}
          sx={{
            ml: "auto",
            bgcolor: "background.paper",
            color: "text.primary",
          }}
        >
          {t("worlds.maps.back-to-map", "Back to the map")}
        </Button>
      </Box>
      {bounds && (
        <WorldMapMinimap
          grid={grid}
          chunks={chunks}
          background={backgroundRect}
          bounds={bounds}
          camera={camera}
          view={view}
          onCenter={(point) => setCamera((value) => ({ ...value, ...point }))}
        />
      )}
    </Box>
  );
}
