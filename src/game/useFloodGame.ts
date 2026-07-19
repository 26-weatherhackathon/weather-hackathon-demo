"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateTerrainGrid,
  getProtectedZone,
  getZoneElevationRange,
  type TerrainGrid,
  type ProtectedZone,
} from "@/utils/terrain";
import {
  STRUCTURES,
  barrierOf,
  isPump,
  basinReductionOf,
  type ToolId,
} from "@/game/structures";

export type Phase = "ready" | "storm" | "result";

/** 호우 시나리오(기상 데이터로 구동되는 엔진 값) */
export interface Scenario {
  name: string;
  /** 시간당 강수량(mm) */
  rainfall: number;
  /** 강수 확률(%) */
  precipProb: number;
  /** 예상 최고 수위(m) */
  peakLevel: number;
}

const SCENARIO: Scenario = {
  name: "2022 여름 집중호우 재현",
  rainfall: 48.5,
  precipProb: 95,
  peakLevel: 16.5,
};

const DURATION = 50; // 호우 지속 시간(초)
const RISE = 36; // 최고 수위 도달까지 걸리는 시간(초)
const BASE_LEVEL = 3; // 평상시 하천 수위(m)
const FLOOD_THRESHOLD = 0.3; // 침수 판정 수심(m)
const BUDGET = 500; // 시작 예산(단위: 만원 → 화면에는 "500만원"으로 표기)
const BASIN_CAP = 2.5; // 저류조 수위 저감 상한(m)

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface FloodGame {
  grid: TerrainGrid;
  zone: ProtectedZone;
  placed: Record<string, ToolId>;
  phase: Phase;
  elapsed: number;
  duration: number;
  level: number; // 현재 수위(m)
  peakLevel: number; // 저류조 반영 예상 최고 수위(m)
  basinReduction: number;
  budget: number;
  startBudget: number;
  tool: ToolId;
  scenario: Scenario;
  villageElev: { min: number; max: number };
  floodThreshold: number;
  floodedNow: number;
  totalHouses: number;
  result: { stars: number; flooded: number } | null;
  setTool: (t: ToolId) => void;
  place: (x: number, y: number) => void;
  start: () => void;
  reset: () => void;
}

export function useFloodGame(): FloodGame {
  const grid = useMemo(() => generateTerrainGrid(), []);
  const zone = useMemo(() => getProtectedZone(grid), [grid]);
  const villageElev = useMemo(
    () => getZoneElevationRange(grid, zone),
    [grid, zone]
  );

  const [phase, setPhase] = useState<Phase>("ready");
  const [placed, setPlaced] = useState<Record<string, ToolId>>({});
  const [budget, setBudget] = useState(BUDGET);
  const [tool, setTool] = useState<ToolId>("sandbag");
  const [elapsed, setElapsed] = useState(0);

  const basinReduction = useMemo(() => {
    let r = 0;
    for (const id of Object.values(placed)) r += basinReductionOf(id);
    return Math.min(BASIN_CAP, r);
  }, [placed]);

  const peakLevel = Math.max(BASE_LEVEL, SCENARIO.peakLevel - basinReduction);

  const levelAt = useCallback(
    (t: number) => {
      const p = Math.min(1, t / RISE);
      const lvl = BASE_LEVEL + (SCENARIO.peakLevel - BASE_LEVEL) * easeInOut(p);
      return Math.max(BASE_LEVEL, lvl - basinReduction);
    },
    [basinReduction]
  );

  const level =
    phase === "ready"
      ? Math.max(BASE_LEVEL - basinReduction, 0)
      : levelAt(Math.min(elapsed, DURATION));

  // 호우 진행 클럭
  useEffect(() => {
    if (phase !== "storm") return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setElapsed((e) => Math.min(DURATION, e + dt));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "storm" && elapsed >= DURATION) setPhase("result");
  }, [phase, elapsed]);

  const floodedAt = useCallback(
    (lvl: number) => {
      let c = 0;
      for (const { x, y } of zone.all) {
        const id = placed[`${x},${y}`];
        if (id && isPump(id)) continue;
        const h = grid[y][x].altitude + barrierOf(id);
        if (lvl - h >= FLOOD_THRESHOLD) c++;
      }
      return c;
    },
    [grid, zone, placed]
  );

  const floodedNow = phase === "ready" ? 0 : floodedAt(level);
  const peakFlooded = floodedAt(peakLevel);
  const stars =
    peakFlooded === 0 ? 3 : peakFlooded <= 2 ? 2 : peakFlooded <= 4 ? 1 : 0;
  const result =
    phase === "result" ? { stars, flooded: peakFlooded } : null;

  const place = useCallback(
    (x: number, y: number) => {
      if (phase === "result") return;
      const key = `${x},${y}`;

      if (tool === "remove") {
        const cur = placed[key];
        if (!cur) return;
        const refund = Math.round(STRUCTURES[cur].cost * 0.5);
        setPlaced((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        });
        setBudget((b) => b + refund);
        return;
      }

      const cell = grid[y]?.[x];
      if (!cell || cell.altitude < 6) return; // 하천/물에는 설치 불가
      if (placed[key]) return; // 이미 설치됨
      const cost = STRUCTURES[tool].cost;
      if (budget < cost) return; // 예산 부족
      setPlaced((p) => ({ ...p, [key]: tool }));
      setBudget((b) => b - cost);
    },
    [phase, tool, placed, budget, grid]
  );

  const start = useCallback(() => {
    if (phase !== "ready") return;
    setElapsed(0);
    setPhase("storm");
  }, [phase]);

  const reset = useCallback(() => {
    setPlaced({});
    setBudget(BUDGET);
    setElapsed(0);
    setPhase("ready");
  }, []);

  return {
    grid,
    zone,
    placed,
    phase,
    elapsed,
    duration: DURATION,
    level,
    peakLevel,
    basinReduction,
    budget,
    startBudget: BUDGET,
    tool,
    scenario: SCENARIO,
    villageElev,
    floodThreshold: FLOOD_THRESHOLD,
    floodedNow,
    totalHouses: zone.all.length,
    result,
    setTool,
    place,
    start,
    reset,
  };
}
