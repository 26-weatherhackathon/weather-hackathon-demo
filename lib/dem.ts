// DEM(수치표고모형) 처리 함수 모음 — docs/PLAN.md 4.1 / 5.1 참고.
// 지금은 실제 국토지리정보원 GeoTIFF 대신 목업 격자를 쓰지만,
// "고도→색상", "D8 흐름 방향", "침수 판정"을 각각 단일 함수로 분리해 두어
// 실제 DEM JSON으로 교체할 때 이 세 함수만 바꾸면 되도록 했다.

export type Grid = number[][]; // elevation[row][col], 단위 m

export const GRID_ROWS = 9;
export const GRID_COLS = 9;

/** 국토지리정보원 5m DEM을 GeoTIFF→JSON 변환했다고 가정한 목업 격자.
 *  좌상단 두 개의 고지대(산)와 그 사이를 굽이쳐 흐르는 저지대(하천)를 형성한다. */
export function createMockDem(): Grid {
  const grid: Grid = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const line: number[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const distHill1 = Math.hypot(row - 1.5, col - 1.5);
      const distHill2 = Math.hypot(row - 7, col - 7);
      const hill1 = Math.max(0, 120 - distHill1 * 22);
      const hill2 = Math.max(0, 90 - distHill2 * 18);

      const riverCol = 4.5 + 2 * Math.sin(row * 0.7);
      const distRiver = Math.abs(col - riverCol);
      const riverDip = Math.max(0, 26 - distRiver * 11);

      const elevation = 18 + hill1 * 0.55 + hill2 * 0.45 - riverDip;
      line.push(Math.round(Math.max(2, Math.min(140, elevation))));
    }
    grid.push(line);
  }
  return grid;
}

/** 고도 → DEM 그래디언트 색상. PLAN.md 5.2.1 (1) 표 그대로 적용. */
export function elevationToColor(elevation: number): string {
  if (elevation >= 100) return "#8D6E4A"; // 산·고지대
  if (elevation >= 30) return "#A9C97E"; // 완만한 경사지
  if (elevation >= 10) return "#6FA96F"; // 평지·마을
  return "#4A90D9"; // 저지대·계곡·물
}

export type FlowDir = { dRow: number; dCol: number } | null;

/** D8: 8방향 이웃 중 최저점으로 물이 흐른다고 보고, 셀별 흐름 방향을 계산.
 *  자기 자신보다 낮은 이웃이 없으면(국지적 저점) null을 반환한다. */
export function computeD8Flow(grid: Grid): FlowDir[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const result: FlowDir[][] = [];

  for (let row = 0; row < rows; row++) {
    const line: FlowDir[] = [];
    for (let col = 0; col < cols; col++) {
      let lowest = grid[row][col];
      let dir: FlowDir = null;

      for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
          if (dRow === 0 && dCol === 0) continue;
          const nRow = row + dRow;
          const nCol = col + dCol;
          if (nRow < 0 || nRow >= rows || nCol < 0 || nCol >= cols) continue;

          const neighborElevation = grid[nRow][nCol];
          if (neighborElevation < lowest) {
            lowest = neighborElevation;
            dir = { dRow, dCol };
          }
        }
      }
      line.push(dir);
    }
    result.push(line);
  }
  return result;
}

/** 침수 판정: 고도 < 기준선 + 강우량인 셀을 침수로 본다. PLAN.md 4.1 참고. */
export function isFlooded(elevation: number, rainfallMm: number, baselineM = 10): boolean {
  return elevation < baselineM + rainfallMm / 10;
}
