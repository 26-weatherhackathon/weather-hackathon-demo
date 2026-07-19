// 30x30 분지형 하천 마을 지형(DEM) 데이터 생성 유틸리티
//
// 지형 구조
//  - 우상단(오른쪽-위) 외곽: 산악 지대(약 40~130m)
//  - 중앙 대각선(x == y): 하천(약 0~8m)
//  - 하천 주변 평지: 마을/학교(약 10~25m)
//
// 물이 산에서 하천으로 모이는 인과관계가 데이터 구조상 드러나도록,
// 우상단에서 고도가 솟고 중앙 대각선을 따라 침식된 하천이 흐르도록 구성한다.

export const GRID_SIZE = 30;

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

/** 결정적 난수 생성기(mulberry32) — 같은 seed면 항상 같은 지형을 만든다. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * 완만한 요철(value noise)을 만드는 함수를 반환한다.
 * 저해상도 난수 격자를 bilinear + smoothstep 보간하여 부드러운 노이즈를 생성한다.
 */
function createValueNoise(
  rand: () => number,
  cells: number
): (nx: number, ny: number) => number {
  const size = cells + 1;
  const grid: number[] = [];
  for (let i = 0; i < size * size; i++) grid.push(rand());

  return (nx: number, ny: number): number => {
    const gx = nx * cells;
    const gy = ny * cells;
    const x0 = Math.min(cells - 1, Math.floor(gx));
    const y0 = Math.min(cells - 1, Math.floor(gy));
    const tx = smoothstep(gx - x0);
    const ty = smoothstep(gy - y0);

    const v00 = grid[y0 * size + x0];
    const v10 = grid[y0 * size + x0 + 1];
    const v01 = grid[(y0 + 1) * size + x0];
    const v11 = grid[(y0 + 1) * size + x0 + 1];

    const a = v00 + (v10 - v00) * tx;
    const b = v01 + (v11 - v01) * tx;
    return a + (b - a) * ty;
  };
}

/**
 * 30x30 분지형 하천 마을 지형을 생성한다.
 * @param seed 결정적 지형 생성을 위한 시드 값
 */
export function generateTerrainGrid(seed = 20260719): TerrainGrid {
  const rand = mulberry32(seed);
  const noise = createValueNoise(rand, 6);
  const N = GRID_SIZE;
  const grid: TerrainGrid = [];

  for (let y = 0; y < N; y++) {
    const row: TerrainCell[] = [];
    for (let x = 0; x < N; x++) {
      const nx = x / (N - 1);
      const ny = y / (N - 1);

      // 우상단(오른쪽-위)에 가까울수록 1에 수렴 → 산악 고도 상승
      const topRight = (nx + (1 - ny)) / 2;
      const mountain = Math.pow(topRight, 2.4) * 130;

      // 평지 기본 고도 + 완만한 지형 요철
      const base = 12;
      const texture = (noise(nx, ny) - 0.5) * 10;

      let altitude = base + mountain + texture;

      // 중앙 대각선(x == y)을 따라 하천을 침식 → 0~8m 수준으로 끌어내림
      const diagDist = Math.abs(x - y);
      const river = Math.max(0, 1 - diagDist / 2.4);
      const riverBed = 1 + noise(ny, nx) * 6;
      altitude = altitude * (1 - river) + riverBed * river;

      altitude = Math.max(0, Math.min(140, altitude));
      const rounded = Math.round(altitude * 10) / 10;

      row.push({
        x,
        y,
        altitude: rounded,
        type: classifyAltitude(rounded),
        color: getColorByAltitude(rounded),
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
 * 좌하단 저지대 범람원의 결정적 좌표(시드 고정 지형 기준)를 사용한다.
 */
export function getProtectedZone(_grid: TerrainGrid): ProtectedZone {
  const houses: TilePos[] = [
    { x: 4, y: 22 },
    { x: 5, y: 22 },
    { x: 6, y: 22 },
    { x: 4, y: 23 },
    { x: 6, y: 23 },
    { x: 4, y: 24 },
    { x: 5, y: 24 },
    { x: 6, y: 24 },
  ];
  const school: TilePos = { x: 5, y: 23 };
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
