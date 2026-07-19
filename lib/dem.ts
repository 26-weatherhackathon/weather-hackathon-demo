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

/** 지역 선택 후 고를 수 있는 4가지 선택지. PLAN.md 5.3 표 그대로. */
export type Protection = "none" | "raise" | "sandbag" | "shelter" | "evacuate";

/** 선택지별 DEM 반영 규칙(PLAN.md 5.3): 침수 판정에 쓰일 "실효 고도"를 계산한다.
 *  높이 올리기는 땅 자체를 돋우고, 모래주머니는 땅은 그대로 둔 채 방벽만 더한다. */
export function applyProtectionElevation(elevation: number, protection: Protection): number {
  if (protection === "raise") return elevation + 30;
  if (protection === "sandbag") return elevation + 10;
  return elevation;
}

/** 격자에서 고도가 가장 높은 셀. "모두 피난" 선택 시 대피 목적지로 쓴다. */
export function findHighestCell(grid: Grid): { row: number; col: number; elevation: number } {
  let best = { row: 0, col: 0, elevation: grid[0][0] };
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] > best.elevation) {
        best = { row, col, elevation: grid[row][col] };
      }
    }
  }
  return best;
}

/** 학습자가 판단해야 할 마을 지점들. 81칸 전체가 아니라 이 지점들만 선택 대상이며,
 *  모두 선택을 마치면(6.2장 STEP 4) 최종 결과 요약을 보여준다. */
export type VillageSpot = { row: number; col: number; label: string };

export const VILLAGE_SPOTS: VillageSpot[] = [
  { row: 2, col: 7, label: "냇가 마을" },
  { row: 7, col: 2, label: "골짜기 마을" },
  { row: 6, col: 3, label: "논 마을" },
  { row: 4, col: 4, label: "언덕 마을" },
];

export type Outcome = { signal: "safe" | "warning" | "danger"; text: string };

/** 선택 결과를 초등 눈높이 문구로 변환. PLAN.md 5.2.1 (2) 신호색 체계에 맞춘다. */
export function describeOutcome(protection: Protection, flooded: boolean): Outcome {
  switch (protection) {
    case "raise":
      return flooded
        ? { signal: "danger", text: "땅을 높였지만 그래도 물이 넘쳤어요" }
        : { signal: "safe", text: "땅을 높였더니 안전해졌어요!" };
    case "sandbag":
      return flooded
        ? { signal: "warning", text: "모래주머니를 넘어 물이 들어왔어요" }
        : { signal: "safe", text: "모래주머니로 물을 막았어요" };
    case "shelter":
      return flooded
        ? { signal: "warning", text: "집은 물에 잠겼지만, 대피소 덕분에 사람들은 안전해요" }
        : { signal: "safe", text: "원래도 안전한 곳이었고, 대피소까지 준비했어요" };
    case "evacuate":
      return { signal: "safe", text: "마을 사람들이 가장 높은 곳으로 대피했어요" };
    default:
      return flooded
        ? { signal: "danger", text: "이 지역이 물에 잠겼어요" }
        : { signal: "safe", text: "이 지역은 안전해요" };
  }
}
