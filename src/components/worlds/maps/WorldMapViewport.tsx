import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import { Box, Button, IconButton, Tooltip, useTheme } from "@mui/material";
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
  boundsIntersect,
  fitCamera,
  mapToScreen,
  panBy,
  screenToMap,
  visibleBounds,
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
  // What of this pin is being dragged (the whole pin, or the id passed to
  // startDrag) and where it is on screen.
  dragging: { id: string; screen: Point } | null;
  // Starts dragging the pin, or one part of it named by `id`, from a
  // pointerdown on it or on a menu it opened. Does nothing unless the map
  // takes drops.
  startDrag: (event: React.PointerEvent<HTMLElement>, id?: string) => void;
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
  // Where a dragged pin (or the part of one passed to startDrag) was let
  // go, snapped to the grid.
  onPinDrop?: (id: string, point: Point) => void;
  // The background image's own size, once it has loaded.
  onBackgroundLoad?: (size: { width: number; height: number }) => void;
  renderPin: (placement: WorldMapPinPlacement<T>) => ReactNode;
  // Extra controls over the map, top left.
  overlay?: ReactNode;
  // Spots whose cells are outlined in the accent colour, such as the
  // selected pin's.
  selectedPoints?: Point[];
  // 44px controls over the map, for phones.
  touch?: boolean;
  // Fits everything again whenever the content grows or shrinks, for a
  // screen nobody steers (the second screen).
  autoFit?: boolean;
  // Back to the map and the minimap; off where the map is only shown.
  controls?: boolean;
  height?: number | string;
}

const ZOOM_STEP = 1.25;
// A finger lifts a pin after holding still this long, and carries it this far
// above itself so the pin stays in sight.
const PIN_LIFT_MS = 400;
const PIN_LIFT_OFFSET = 40;
// How long a still finger waits for a second one before it paints.
const TOUCH_STROKE_DELAY_MS = 120;
const PAN_STEP = 64;
// How long the minimap stays after the view stops moving.
const MINIMAP_LINGER_MS = 1500;
// Whether this device keeps the minimap open.
const MINIMAP_KEPT_KEY = "world-map-minimap-kept";

function readMinimapKept(): boolean {
  try {
    return localStorage.getItem(MINIMAP_KEPT_KEY) === "true";
  } catch {
    return false;
  }
}

function writeMinimapKept(kept: boolean) {
  try {
    localStorage.setItem(MINIMAP_KEPT_KEY, String(kept));
  } catch {
    // Storage is off; the choice lasts until the page closes.
  }
}

function getViewSize(element: HTMLElement | null): ViewSize {
  return {
    width: element?.clientWidth ?? 0,
    height: element?.clientHeight ?? 0,
  };
}

// The map canvas: infinite in every direction, drawn a chunk at a time for
// what is on screen. Wheel, pinch, keyboard and the minimap move the view.
// The minimap shows while the view moves, or stays when kept open; Back to the
// map appears once nothing of the map is on screen and fits everything again.
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
    selectedPoints,
    touch = false,
    autoFit = false,
    controls = true,
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
  // The pin being dragged and where it would land.
  const [draggedPin, setDraggedPin] = useState<{
    id: string;
    placementId: string;
    point: Point;
  }>();
  const theme = useTheme();
  const selectedKey = selectedPoints
    ?.map((point) => `${point.x},${point.y}`)
    .join(";");
  const selectedCells = useMemo(
    () =>
      grid === "none" || !selectedPoints?.length
        ? undefined
        : selectedPoints.map((point) => cellAt(grid, point)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid, selectedKey],
  );

  // The minimap wakes while the view moves and fades a moment after.
  const [minimapKept, setMinimapKept] = useState(readMinimapKept);
  const [minimapAwake, setMinimapAwake] = useState(false);
  const minimapTimer = useRef<number | undefined>(undefined);
  const wakeMinimap = useCallback(() => {
    setMinimapAwake(true);
    window.clearTimeout(minimapTimer.current);
    minimapTimer.current = window.setTimeout(
      () => setMinimapAwake(false),
      MINIMAP_LINGER_MS,
    );
  }, []);
  useEffect(() => () => window.clearTimeout(minimapTimer.current), []);

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
  const boundsKey = bounds
    ? [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].join(",")
    : "";
  useEffect(() => {
    if (!autoFit || !fitted.current || !view.width) return;
    setCamera(fitCamera(boundsRef.current, view));
  }, [autoFit, boundsKey, view]);
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
          // A pin being dragged outlines the cell it would land in.
          highlight:
            draggedPin && grid !== "none"
              ? [cellAt(grid, draggedPin.point)]
              : toolActive
                ? highlight
                : undefined,
          selected: selectedCells
            ? { cells: selectedCells, color: theme.palette.primary.main }
            : undefined,
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
    draggedPin,
    selectedCells,
    theme.palette.primary.main,
  ]);

  // Pointers: one uses the tool (or pans), two pan and pinch.
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<
    | { type: "tool" }
    // A finger down that may yet become a pinch: the stroke waits until it
    // moves, holds still a moment, or lifts.
    | { type: "pending"; start: Point; time: number }
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
    // A second finger puts back a pin held by the first.
    if (
      pinDrag.current &&
      pinDrag.current.pointerId !== event.pointerId &&
      event.pointerType === "touch"
    )
      cancelPinDrag();
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
      } else if (
        toolActive &&
        event.button === 0 &&
        event.pointerType === "touch"
      ) {
        gesture.current = {
          type: "pending",
          start: screen,
          time: event.timeStamp,
        };
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
      const distance = Math.hypot(
        screen.x - held.start.x,
        screen.y - held.start.y,
      );
      if (held.touch && !held.moved) {
        // A finger that moves before the pin lifts pans the map instead.
        if (distance > 8) {
          cancelPinDrag();
          pointers.current.set(event.pointerId, screen);
          gesture.current = { type: "pan", last: screen };
        }
        return;
      }
      if (distance > 4) held.moved = true;
      if (!held.moved) return;
      movePinTo(held, screen);
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
    if (current.type === "pending") {
      const moved = Math.hypot(
        screen.x - current.start.x,
        screen.y - current.start.y,
      );
      if (moved < 8 && event.timeStamp - current.time < TOUCH_STROKE_DELAY_MS)
        return;
      gesture.current = { type: "tool" };
      onToolPointer?.(toolEvent("start", current.start, event.pointerType));
    }
    if (gesture.current?.type === "tool") {
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
      wakeMinimap();
    } else if (current.type === "pinch" && pointers.current.size >= 2) {
      wakeMinimap();
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
      cancelPinDrag();
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
    if (
      current?.type === "pending" &&
      pointers.current.size === 0 &&
      event.type !== "pointercancel"
    ) {
      // A tap paints where it landed.
      onToolPointer?.(toolEvent("start", current.start, event.pointerType));
      onToolPointer?.(toolEvent("end", current.start, event.pointerType));
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
  interface HeldPin {
    id: string;
    placementId: string;
    pointerId: number;
    start: Point;
    point: Point;
    // Picked up: past the click distance, or held long enough by a finger.
    moved: boolean;
    touch: boolean;
    timer?: number;
  }
  const pinDrag = useRef<HeldPin | null>(null);
  const movePinTo = (held: HeldPin, screen: Point) => {
    const point = snapToGrid(
      grid,
      screenToMap(
        cameraRef.current,
        getViewSize(containerRef.current),
        held.touch ? { x: screen.x, y: screen.y - PIN_LIFT_OFFSET } : screen,
      ),
    );
    held.point = point;
    setDraggedPin({ id: held.id, placementId: held.placementId, point });
  };
  const cancelPinDrag = () => {
    window.clearTimeout(pinDrag.current?.timer);
    pinDrag.current = null;
    setDraggedPin(undefined);
  };
  const suppressClick = useRef(false);
  const startPinDrag = (
    id: string,
    placementId: string,
    point: Point,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (!onPinDrop || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    suppressClick.current = false;
    const held: HeldPin = {
      id,
      placementId,
      pointerId: event.pointerId,
      start: localPoint(event),
      point,
      moved: false,
      touch: event.pointerType === "touch",
    };
    if (held.touch)
      held.timer = window.setTimeout(() => {
        if (pinDrag.current !== held) return;
        held.moved = true;
        navigator.vibrate?.(10);
        movePinTo(held, held.start);
      }, PIN_LIFT_MS);
    pinDrag.current = held;
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
      wakeMinimap();
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [wakeMinimap]);

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
    if (event.key !== "0") wakeMinimap();
  };

  const offScreen =
    !!bounds &&
    view.width > 0 &&
    !boundsIntersect(bounds, visibleBounds(camera, view));
  const minimapShown = minimapKept || minimapAwake;

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
          const dragged =
            draggedPin?.placementId === placement.id ? draggedPin : undefined;
          return renderPin({
            ...placement,
            screen: mapToScreen(camera, view, placement.point),
            scale: camera.scale,
            dragging: dragged
              ? {
                  id: dragged.id,
                  screen: mapToScreen(camera, view, dragged.point),
                }
              : null,
            startDrag: (event, id = placement.id) =>
              startPinDrag(id, placement.id, placement.point, event),
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
        {controls && offScreen && (
          <Button
            size="small"
            variant="contained"
            color="inherit"
            startIcon={<CenterFocusStrongIcon />}
            onClick={fit}
            sx={{
              ml: "auto",
              minHeight: touch ? 44 : undefined,
              bgcolor: "background.paper",
              color: "text.primary",
            }}
          >
            {t("worlds.maps.back-to-map", "Back to the map")}
          </Button>
        )}
      </Box>
      {controls && bounds && (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            bottom: 8,
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
            pointerEvents: "none",
          }}
        >
          <Box
            aria-hidden={!minimapShown}
            sx={{
              opacity: minimapShown ? 1 : 0,
              transition: (theme) =>
                theme.transitions.create("opacity", {
                  duration: minimapShown
                    ? theme.transitions.duration.shortest
                    : theme.transitions.duration.standard,
                }),
              pointerEvents: minimapShown ? "auto" : "none",
            }}
          >
            <WorldMapMinimap
              grid={grid}
              chunks={chunks}
              background={backgroundRect}
              bounds={bounds}
              camera={camera}
              view={view}
              onCenter={(point) => {
                setCamera((value) => ({ ...value, ...point }));
                wakeMinimap();
              }}
            />
          </Box>
          <Tooltip
            title={
              minimapKept
                ? t("worlds.maps.minimap-hide", "Hide the minimap")
                : t("worlds.maps.minimap-keep", "Keep the minimap open")
            }
          >
            <IconButton
              size="small"
              aria-label={t(
                "worlds.maps.minimap-keep",
                "Keep the minimap open",
              )}
              aria-pressed={minimapKept}
              onClick={() => {
                setMinimapKept(!minimapKept);
                writeMinimapKept(!minimapKept);
              }}
              sx={{
                pointerEvents: "auto",
                bgcolor: minimapKept ? "primary.main" : "background.paper",
                color: minimapKept ? "primary.contrastText" : "text.primary",
                boxShadow: 2,
                "&:hover": {
                  bgcolor: minimapKept ? "primary.dark" : "background.paper",
                },
              }}
            >
              <MapOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
