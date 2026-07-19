// 실제 동작구 DEM(Copernicus GLO-30) 고도 격자로 지형을 만드는 유틸리티.
//
// scripts/dem_to_grid.py가 GeoTIFF를 크롭·리샘플링해 만든 data/dem/dongjak_grid.json을
// 빌드 시점에 import한다. 격자의 고도값이 그대로 고도→색상·D8 물 흐름·침수 판정의
// 입력이 된다(PLAN.md 4.1). 5m DEM 교체 시 파이프라인만 재실행하면 된다.

import demData from "../../data/dem/dongjak_grid.json";

export const GRID_SIZE = demData.size;

export type TerrainType = "mountain" | "hill" | "plain" | "water";

export interface TerrainCell {
  x: number;
  y: number;
  /** 고도(미터) */
  altitude: number;
  type: TerrainType;
  /** 고도 구간에 매핑된 16진 색상 코드 */
  color: string;
}

export type TerrainGrid = TerrainCell[][];

/** 고도 구간별 색상 코드(DEM 그래디언트) */
export const TERRAIN_COLORS: Record<TerrainType, string> = {
  mountain: "#8D6E4A", // 100m 이상 · 산/고지대 (갈색)
  hill: "#A9C97E", // 30~100m · 완만한 경사지 (연두)
  plain: "#6FA96F", // 10~30m · 평지/마을 (초록)
  water: "#4A90D9", // 10m 미만 · 저지대/계곡/물 (파랑)
};

/** 고도 값을 지형 타입으로 분류한다. */
export function classifyAltitude(altitude: number): TerrainType {
  if (altitude >= 100) return "mountain";
  if (altitude >= 30) return "hill";
  if (altitude >= 10) return "plain";
  return "water";
}

/** 고도 값에 대응하는 16진 색상 코드를 반환한다. */
export function getColorByAltitude(altitude: number): string {
  return TERRAIN_COLORS[classifyAltitude(altitude)];
}

/**
 * 실제 동작구 DEM 고도 격자(dongjak_grid.json)에서 지형을 만든다.
 * grid[r][c]: r=0이 최북단(north), c=0이 최서단(west).
 */
export function generateTerrainGrid(): TerrainGrid {
  const rows = demData.grid as number[][];
  const grid: TerrainGrid = [];

  for (let y = 0; y < rows.length; y++) {
    const row: TerrainCell[] = [];
    for (let x = 0; x < rows[y].length; x++) {
      const altitude = rows[y][x];
      row.push({
        x,
        y,
        altitude,
        type: classifyAltitude(altitude),
        color: getColorByAltitude(altitude),
      });
    }
    grid.push(row);
  }

  return grid;
}

export interface TilePos {
  x: number;
  y: number;
}

export interface ProtectedZone {
  /** 지켜야 할 집들 */
  houses: TilePos[];
  /** 학교(가장 중요) */
  school: TilePos;
  /** houses + school */
  all: TilePos[];
}

/**
 * 지켜야 할 마을(집·학교)의 위치를 반환한다.
 * 실제 DEM에서 가장 낮은 저지대(범람에 가장 먼저 노출되는 곳) 9개 셀을 골라
 * 최저점을 학교, 나머지를 집으로 둔다. 실데이터가 마을 위치를 결정한다.
 */
export function getProtectedZone(grid: TerrainGrid): ProtectedZone {
  const cells: TilePos[] = [];
  for (const row of grid) for (const c of row) cells.push({ x: c.x, y: c.y });
  cells.sort((a, b) => grid[a.y][a.x].altitude - grid[b.y][b.x].altitude);

  const lowest = cells.slice(0, 9);
  const school = lowest[0];
  const houses = lowest.slice(1);
  return { houses, school, all: [...houses, school] };
}

/** 마을(보호 대상) 타일들의 최저/최고 고도를 반환한다. */
export function getZoneElevationRange(
  grid: TerrainGrid,
  zone: ProtectedZone
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const { x, y } of zone.all) {
    const a = grid[y][x].altitude;
    if (a < min) min = a;
    if (a > max) max = a;
  }
  return { min, max };
}
