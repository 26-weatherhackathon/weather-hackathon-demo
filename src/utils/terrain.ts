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

/** 시설 배치가 허용되는 최소 고도(useFloodGame.ts의 배치 규칙과 일치). */
const MIN_BUILDABLE_ALTITUDE = 6;

/**
 * 지켜야 할 마을(집·학교)의 위치를 반환한다.
 *
 * 하천 바닥(설치 불가 고도)에는 마을을 두지 않는다. 그 경우 어떤 시설도
 * 놓을 수 없어 선택과 무관하게 항상 침수되어 게임의 핵심 루프(선택에 따라
 * 결과가 달라짐)가 무너진다. 대신 "시설을 놓을 수 있는 3x3 인접 구역" 중
 * 평균 고도가 가장 낮은(가장 침수 위험이 큰) 블록을 찾아 마을로 둔다.
 * 일부 셀은 방어 없이도 안전하고 일부는 조합이 필요하도록, 실제 지형의
 * 기복이 자연스럽게 난이도를 만든다.
 */
export function getProtectedZone(grid: TerrainGrid): ProtectedZone {
  const N = grid.length;

  // 설치 가능(>= MIN_BUILDABLE)한 타일을 고도 낮은 순으로 모은다(낮을수록 침수에 취약).
  const buildable: { x: number; y: number; alt: number }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const alt = grid[y][x].altitude;
      if (alt >= MIN_BUILDABLE_ALTITUDE) buildable.push({ x, y, alt });
    }
  }
  buildable.sort((a, b) => a.alt - b.alt);

  // 취약한 저지대 후보군에서 서로 간격을 두고 분산 배치(한 곳에 뭉치지 않도록).
  const pool = buildable.slice(0, Math.max(40, Math.floor(buildable.length * 0.4)));
  const MIN_DIST = 4; // 맨해튼 거리
  const TARGET = 9;
  const chosen: TilePos[] = [];
  const farEnough = (p: { x: number; y: number }) =>
    chosen.every((c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) >= MIN_DIST);

  const first = pool[0] ?? buildable[0] ?? { x: 0, y: 0, alt: 0 };
  const school: TilePos = { x: first.x, y: first.y }; // 가장 낮은 = 가장 취약 = 학교
  chosen.push(school);

  for (const p of pool) {
    if (chosen.length >= TARGET) break;
    if (p.x === school.x && p.y === school.y) continue;
    if (farEnough(p)) chosen.push({ x: p.x, y: p.y });
  }
  // 간격 조건으로 부족하면 완화해 채운다.
  if (chosen.length < TARGET) {
    for (const p of pool) {
      if (chosen.length >= TARGET) break;
      if (chosen.some((c) => c.x === p.x && c.y === p.y)) continue;
      chosen.push({ x: p.x, y: p.y });
    }
  }

  const houses = chosen.filter(
    (c) => !(c.x === school.x && c.y === school.y)
  );
  return { houses, school, all: [school, ...houses] };
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
