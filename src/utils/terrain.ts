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
 * 마을 건물을 뽑는 고도 밴드(PLAN.md 5.3).
 *
 * 경계값은 게임 상수에서 유도된다(변경 시 scripts/balance_check.mjs로 재검증):
 *   최고 수위 16.5m − 침수 판정 0.3m = 맨몸 안전선 16.2m
 *   16.2 − 모래주머니 1.5m = 14.7m  → 그 위는 모래주머니(20만원)로 방어 가능
 *   16.2 − 제방 6m       = 10.2m  → 그 위는 제방(70만원)으로 방어 가능
 *   그 아래 저지대는 배수펌프(90만원)만 유효
 *
 * 이렇게 9채를 계층 배치하면 완전 방어(3★) 최적해가 펌프2+제방3+모래주머니4
 * = 470만원으로 예산(500만원) 안에 들어오되, 집마다 고도를 읽고 알맞은
 * 시설을 골라야만 달성된다(전부 저지대에 몰리면 2★조차 예산 초과로 불가능).
 */
const VILLAGE_BANDS: { min: number; max: number; count: number }[] = [
  { min: MIN_BUILDABLE_ALTITUDE, max: 10.2, count: 2 }, // 저지대(학교 포함): 펌프 전용
  { min: 10.2, max: 13.2, count: 3 }, // 중지대: 제방 권장
  { min: 14.7, max: 16.2, count: 4 }, // 상부: 모래주머니면 충분
];

/**
 * 지켜야 할 마을(집·학교)의 위치를 반환한다.
 *
 * 하천 바닥(설치 불가 고도)에는 마을을 두지 않는다. 그 경우 어떤 시설도
 * 놓을 수 없어 선택과 무관하게 항상 침수되어 게임의 핵심 루프(선택에 따라
 * 결과가 달라짐)가 무너진다. 건물은 VILLAGE_BANDS의 고도 밴드별로 서로
 * 간격을 두고 분산 배치해, 시설 4종이 각자 알맞은 쓰임새를 갖고 예산 안에서
 * 완전 방어가 가능한 난이도를 만든다. 가장 낮은(가장 취약한) 자리가 학교다.
 */
export function getProtectedZone(grid: TerrainGrid): ProtectedZone {
  const N = grid.length;

  const buildable: { x: number; y: number; alt: number }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const alt = grid[y][x].altitude;
      if (alt >= MIN_BUILDABLE_ALTITUDE) buildable.push({ x, y, alt });
    }
  }
  buildable.sort((a, b) => a.alt - b.alt);

  const MIN_DIST = 4; // 맨해튼 거리(뭉침 방지)
  const chosen: TilePos[] = [];
  const farEnough = (p: { x: number; y: number }, d: number) =>
    chosen.every((c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) >= d);

  for (const band of VILLAGE_BANDS) {
    const pool = buildable.filter((p) => p.alt >= band.min && p.alt < band.max);
    let need = band.count;
    // 간격 조건을 만족하는 후보부터 채우고, 부족하면 간격을 완화한다.
    for (let dist = MIN_DIST; dist >= 0 && need > 0; dist--) {
      for (const p of pool) {
        if (need <= 0) break;
        if (chosen.some((c) => c.x === p.x && c.y === p.y)) continue;
        if (!farEnough(p, dist)) continue;
        chosen.push({ x: p.x, y: p.y });
        need--;
      }
    }
  }

  // 저지대 밴드의 첫 후보 = 전체에서 가장 낮은 = 가장 취약 = 학교
  const school: TilePos = chosen[0] ?? { x: 0, y: 0 };
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
