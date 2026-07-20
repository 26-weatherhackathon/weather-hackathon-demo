// 게임 밸런스 자동 검증 (PLAN.md 5.3)
//
// 실제 DEM 격자(data/dem/dongjak_grid.json) 위에서 마을 배치 로직을 재현하고,
// 시설 조합을 브루트포스로 탐색해 별점별 최소 비용을 계산한다. 다음을 보장한다.
//   1) 3★(완전 방어)이 예산 안에서 가능하다  — "깰 수 없는 게임" 방지
//   2) 3★ 최소 비용이 너무 싸지 않다        — 고민 없이 깨지는 게임 방지
//   3) 2★가 3★보다 충분히 싸다             — 단계적 성취 곡선 확보
//
// 지형(DEM)·게임 상수(예산·시설 효과·밴드)를 바꿀 때마다 실행한다:
//   npm run balance
//
// 주의: 아래 상수는 src/game/useFloodGame.ts·structures.ts·utils/terrain.ts의
// 값과 수동으로 정합을 맞춘다(런타임 코드는 TS라 직접 import하지 않는다).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dem = JSON.parse(
  readFileSync(join(__dirname, "../data/dem/dongjak_grid.json"), "utf8")
);

// ── 게임 상수(useFloodGame.ts / structures.ts) ──
const PEAK = 16.5; // 예상 최고 수위(m)
const FLOOD_THRESHOLD = 0.3; // 침수 판정 수심(m)
const BUDGET = 500; // 시작 예산(만원)
const SANDBAG = { cost: 20, barrier: 1.5 };
const LEVEE = { cost: 70, barrier: 6 };
const PUMP = { cost: 90 };
const BASIN = { cost: 80, reduction: 1 };
const BASIN_CAP = 3; // 저감 상한(m) → 최대 3개 유효

// ── 마을 배치(terrain.ts getProtectedZone과 동일 로직) ──
const MIN_BUILDABLE = 6;
const BANDS = [
  { min: MIN_BUILDABLE, max: 10.2, count: 2 },
  { min: 10.2, max: 13.2, count: 3 },
  { min: 14.7, max: 16.2, count: 4 },
];
const MIN_DIST = 4;

function villageAltitudes() {
  const buildable = [];
  const g = dem.grid;
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[y].length; x++)
      if (g[y][x] >= MIN_BUILDABLE) buildable.push({ x, y, alt: g[y][x] });
  buildable.sort((a, b) => a.alt - b.alt);

  const chosen = [];
  const farEnough = (p, d) =>
    chosen.every((c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) >= d);
  for (const band of BANDS) {
    const pool = buildable.filter((p) => p.alt >= band.min && p.alt < band.max);
    let need = band.count;
    for (let dist = MIN_DIST; dist >= 0 && need > 0; dist--) {
      for (const p of pool) {
        if (need <= 0) break;
        if (chosen.some((c) => c.x === p.x && c.y === p.y)) continue;
        if (!farEnough(p, dist)) continue;
        chosen.push(p);
        need--;
      }
    }
  }
  return chosen.map((c) => c.alt);
}

/** k채를 지키는 최소 비용(저류조 개수 브루트포스 + 집별 최저가 시설). */
function minCostToSave(alts, k) {
  const maxBasins = Math.ceil(BASIN_CAP / BASIN.reduction);
  let best = Infinity;
  for (let b = 0; b <= maxBasins; b++) {
    const peak = PEAK - Math.min(BASIN_CAP, b * BASIN.reduction);
    const safeLine = peak - FLOOD_THRESHOLD; // 이 고도 이상이면 맨몸 안전
    const perHouse = alts
      .map((a) =>
        a >= safeLine
          ? 0
          : a + SANDBAG.barrier >= safeLine
          ? SANDBAG.cost
          : a + LEVEE.barrier >= safeLine
          ? LEVEE.cost
          : PUMP.cost
      )
      .sort((p, q) => p - q);
    const cost =
      BASIN.cost * b + perHouse.slice(0, k).reduce((s, v) => s + v, 0);
    best = Math.min(best, cost);
  }
  return best;
}

// ── 검증 ──
const alts = villageAltitudes();
const n = alts.length;
const cost3 = minCostToSave(alts, n); // 3★: 침수 0채
const cost2 = minCostToSave(alts, n - 2); // 2★: 침수 ≤2채
const cost1 = minCostToSave(alts, n - 4); // 1★: 침수 ≤4채

console.log(`마을 ${n}채 고도: ${alts.map((a) => a.toFixed(1)).join(" / ")}m`);
console.log(`예산 ${BUDGET}만원 기준 최소 비용:`);
console.log(`  1★ (침수 ≤4채): ${cost1}만원`);
console.log(`  2★ (침수 ≤2채): ${cost2}만원`);
console.log(`  3★ (침수 0채):  ${cost3}만원`);

const failures = [];
if (n !== 9) failures.push(`마을 건물이 9채가 아님(${n}채) — 밴드에 후보 타일 부족`);
if (cost3 > BUDGET) failures.push(`3★ 최소 비용(${cost3})이 예산(${BUDGET}) 초과 — 깰 수 없는 게임`);
if (cost3 < BUDGET * 0.8) failures.push(`3★ 최소 비용(${cost3})이 예산의 80% 미만 — 너무 쉬움`);
if (cost2 > cost3 - 100) failures.push(`2★(${cost2})와 3★(${cost3}) 비용 차 100 미만 — 성취 단계가 밋밋함`);

if (failures.length) {
  console.error("\n❌ 밸런스 검증 실패:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\n✅ 밸런스 검증 통과 (예산 내 3★ 가능, 난이도 하한·성취 곡선 확보)");
