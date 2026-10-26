import { Bounds, Point } from "./grid";

// What the map shows: the map point at the centre of the view, and the scale
// (1 is the default cell size).
export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface ViewSize {
  width: number;
  height: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 4;
export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 };
const FIT_PADDING = 48;

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function mapToScreen(
  camera: Camera,
  view: ViewSize,
  point: Point,
): Point {
  return {
    x: (point.x - camera.x) * camera.scale + view.width / 2,
    y: (point.y - camera.y) * camera.scale + view.height / 2,
  };
}

export function screenToMap(
  camera: Camera,
  view: ViewSize,
  point: Point,
): Point {
  return {
    x: (point.x - view.width / 2) / camera.scale + camera.x,
    y: (point.y - view.height / 2) / camera.scale + camera.y,
  };
}

export function visibleBounds(camera: Camera, view: ViewSize): Bounds {
  const halfWidth = view.width / 2 / camera.scale;
  const halfHeight = view.height / 2 / camera.scale;
  return {
    minX: camera.x - halfWidth,
    minY: camera.y - halfHeight,
    maxX: camera.x + halfWidth,
    maxY: camera.y + halfHeight,
  };
}

// An empty map opens at the default size. A map with content fits all of it,
// never zoomed in past the default size.
export function fitCamera(bounds: Bounds | undefined, view: ViewSize): Camera {
  if (!bounds || view.width <= 0 || view.height <= 0) return DEFAULT_CAMERA;
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(
    1,
    (view.width - FIT_PADDING * 2) / width,
    (view.height - FIT_PADDING * 2) / height,
  );
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    scale: clampScale(scale),
  };
}

// Zooms by `factor`, keeping the map point under `screenPoint` still.
export function zoomAt(
  camera: Camera,
  view: ViewSize,
  screenPoint: Point,
  factor: number,
): Camera {
  const scale = clampScale(camera.scale * factor);
  const anchor = screenToMap(camera, view, screenPoint);
  return {
    scale,
    x: anchor.x - (screenPoint.x - view.width / 2) / scale,
    y: anchor.y - (screenPoint.y - view.height / 2) / scale,
  };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return {
    ...camera,
    x: camera.x - dx / camera.scale,
    y: camera.y - dy / camera.scale,
  };
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}
