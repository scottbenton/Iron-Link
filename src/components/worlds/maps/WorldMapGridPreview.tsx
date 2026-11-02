import { Box } from "@mui/material";
import { useMemo } from "react";

import {
  Cell,
  PaintableGrid,
  WorldMapGrid,
  cellAt,
  cellCenter,
  cellCorners,
  cellLine,
  cellsInBounds,
} from "lib/worldMap/grid";
import {
  WORLD_MAP_BACKGROUND,
  WORLD_MAP_PATH_COLOR,
  getTerrainColor,
} from "lib/worldMap/terrain";

// The preview's window onto the map, in map units.
const VIEW = { minX: -100, minY: -46, maxX: 100, maxY: 46 };

// A few painted cells and a path, so each grid shows how its maps look.
function paintedTerrain(grid: PaintableGrid, cell: Cell): string {
  const { x, y } = cellCenter(grid, cell);
  if (y > 20 && x < 10) return "water";
  if (x > 40) return "treeCover";
  if (x + y < -40) return "rock";
  return "grass";
}

function points(corners: { x: number; y: number }[]): string {
  return corners.map((corner) => `${corner.x},${corner.y}`).join(" ");
}

// A small drawing of a grid for the grid picker. A map without a grid is an
// image with pins on it.
export function WorldMapGridPreview({ grid }: { grid: WorldMapGrid }) {
  const cells = useMemo(
    () => (grid === "none" ? [] : cellsInBounds(grid, VIEW)),
    [grid],
  );
  return (
    <Box
      component="svg"
      aria-hidden
      viewBox={`${VIEW.minX} ${VIEW.minY} ${VIEW.maxX - VIEW.minX} ${VIEW.maxY - VIEW.minY}`}
      preserveAspectRatio="xMidYMid slice"
      sx={{
        display: "block",
        width: "100%",
        height: 88,
        mt: 1.5,
        borderRadius: 1,
        bgcolor: WORLD_MAP_BACKGROUND,
      }}
    >
      {grid === "none" ? (
        <NoGridPreview />
      ) : (
        <>
          {cells.map((cell) => {
            const terrain = paintedTerrain(grid, cell);
            return (
              <polygon
                key={`${cell.x},${cell.y}`}
                points={points(cellCorners(grid, cell))}
                fill={getTerrainColor(terrain)}
                stroke="rgba(0, 0, 0, 0.35)"
                strokeWidth={1}
              />
            );
          })}
          <polyline
            points={points(
              cellLine(
                grid,
                cellAt(grid, { x: -90, y: -14 }),
                cellAt(grid, { x: 90, y: 12 }),
              ).map((cell) => cellCenter(grid, cell)),
            )}
            fill="none"
            stroke={WORLD_MAP_PATH_COLOR}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Box>
  );
}

function NoGridPreview() {
  return (
    <>
      <rect x={-70} y={-36} width={140} height={72} rx={4} fill="#3b4a3f" />
      <path
        d="M-70 20 L-30 -12 L0 12 L28 -20 L70 16 L70 32 Q70 36 66 36 L-66 36 Q-70 36 -70 32 Z"
        fill="#5f7a5a"
      />
      <circle cx={-40} cy={-18} r={7} fill="#e8d9b0" />
      <g transform="translate(16 -4)">
        <path
          d="M0 14 C-8 4 -10 -1 -10 -5 A10 10 0 0 1 10 -5 C10 -1 8 4 0 14 Z"
          fill="#d84a3a"
          stroke="#fff"
          strokeWidth={1.5}
        />
        <circle cx={0} cy={-5} r={3.5} fill="#fff" />
      </g>
    </>
  );
}
