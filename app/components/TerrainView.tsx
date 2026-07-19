"use client";

import { useMemo } from "react";
import {
  applyProtectionElevation,
  elevationToColor,
  isFlooded,
  TERRAIN_COLORS,
  ROAD_PATH,
  type Grid,
  type FlowDir,
  type Protection,
  type VillageSpot,
  GRID_ROWS,
  GRID_COLS,
} from "@/lib/dem";
import SignalIcon from "./SignalIcon";

const TILE_W = 84; // 다이아몬드 타일 가로 폭(px) — 격자를 줄인 만큼 타일을 키워 잘 보이게 한다
const TILE_H = 42; // 다이아몬드 타일 세로 폭(px)
const HEIGHT_SCALE = 0.6; // 고도 1m당 타일을 들어올리는 픽셀 수

type Props = {
  grid: Grid;
  flow: FlowDir[][];
  highest: { row: number; col: number };
  villageSpots: VillageSpot[];
  showTerrain: boolean;
  showFlow: boolean;
  showRain: boolean;
  rainfallMm: number;
  protections: Record<string, Protection>;
  selectedKey: string | null;
  onTileClick: (row: number, col: number) => void;
};

// 이웃 방향(dRow, dCol) → 아이소메트릭 화면에서의 회전각(deg)
function directionToDeg(dRow: number, dCol: number): number {
  const angle = Math.atan2(dRow, dCol) * (180 / Math.PI);
  return angle + 90; // 기본 화살표(▲)가 위(북)를 향하므로 90도 보정
}

// 경사지·고지대 타일 중 일부에만 결정적으로(고정 시드) 나무를 놓아 자연스럽게 흩뿌린다.
function hasTree(row: number, col: number): boolean {
  return (row * 13 + col * 7) % 3 === 0;
}

export default function TerrainView({
  grid,
  flow,
  highest,
  villageSpots,
  showTerrain,
  showFlow,
  showRain,
  rainfallMm,
  protections,
  selectedKey,
  onTileClick,
}: Props) {
  const spotMap = useMemo(
    () => new Map(villageSpots.map((spot) => [`${spot.row}-${spot.col}`, spot])),
    [villageSpots]
  );

  const roadSet = useMemo(() => new Set(ROAD_PATH.map((p) => `${p.row}-${p.col}`)), []);

  const floodedCount = useMemo(() => {
    if (!showRain) return 0;
    let count = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const protection = protections[`${row}-${col}`] ?? "none";
        const effective = applyProtectionElevation(grid[row][col], protection);
        if (isFlooded(effective, rainfallMm)) count++;
      }
    }
    return count;
  }, [grid, showRain, rainfallMm, protections]);

  const hasEvacuation = useMemo(
    () => Object.values(protections).some((p) => p === "evacuate"),
    [protections]
  );

  // 격자 전체를 감쌀 컨테이너 크기(다이아몬드 배치 기준)
  const containerWidth = (GRID_ROWS + GRID_COLS) * (TILE_W / 2);
  const containerHeight = (GRID_ROWS + GRID_COLS) * (TILE_H / 2) + 140;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        style={{ width: containerWidth, height: containerHeight }}
        role="img"
        aria-label="우리 마을 지형도"
      >
        {grid.map((line, row) =>
          line.map((elevation, col) => {
            const key = `${row}-${col}`;
            const protection = protections[key] ?? "none";
            const effectiveElevation = applyProtectionElevation(elevation, protection);
            // 높이 올리기는 땅 자체를 돋우므로 화면에도 반영, 모래주머니는 방벽만 추가한 것이라 지형 색은 그대로 둔다.
            const displayElevation = protection === "raise" ? effectiveElevation : elevation;

            const left = containerWidth / 2 + (col - row) * (TILE_W / 2) - TILE_W / 2;
            const top = (col + row) * (TILE_H / 2) - displayElevation * HEIGHT_SCALE + 70;

            const color = showTerrain ? elevationToColor(displayElevation) : "#c9c9c9";
            const flooded = showRain && isFlooded(effectiveElevation, rainfallMm);
            const dir = flow[row][col];
            const isSelected = selectedKey === key;
            const spot = spotMap.get(key);
            const isRoad = roadSet.has(key);
            const isRiver = showTerrain && color === TERRAIN_COLORS.low.color;
            const isForest =
              showTerrain &&
              !spot &&
              !isRoad &&
              (color === TERRAIN_COLORS.slope.color || color === TERRAIN_COLORS.high.color) &&
              hasTree(row, col);

            let signal: "safe" | "warning" | "danger" | null = null;
            if (protection === "shelter") signal = flooded ? "warning" : "safe";
            else if (protection === "sandbag") signal = flooded ? "warning" : "safe";
            else if (protection === "raise") signal = flooded ? "danger" : "safe";
            else if (protection === "evacuate") signal = "safe";

            return (
              <button
                type="button"
                key={key}
                onClick={() => spot && onTileClick(row, col)}
                disabled={!spot}
                aria-label={
                  spot
                    ? `${spot.label} 지역, 고도 ${elevation}m${flooded ? ", 침수됨" : ""}`
                    : undefined
                }
                aria-hidden={!spot}
                tabIndex={spot ? 0 : -1}
                className={`absolute ${spot ? "cursor-pointer" : "cursor-default"}`}
                style={{
                  left,
                  top,
                  width: TILE_W,
                  height: TILE_H + displayElevation * HEIGHT_SCALE,
                }}
              >
                {/* 측면(고도만큼 아래로 두께를 준 벽면) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: TILE_H / 2,
                    width: TILE_W * 0.7,
                    height: displayElevation * HEIGHT_SCALE,
                    background: color,
                    filter: "brightness(0.72)",
                    clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
                  }}
                />
                {/* 윗면(다이아몬드) */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: color,
                    border: isSelected ? "2px solid #1d4ed8" : "1px solid rgba(0,0,0,0.1)",
                    transform: "rotate(45deg) scaleY(0.58)",
                    transformOrigin: "center",
                  }}
                />
                {isRoad && (
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: TILE_W * 0.62,
                      height: TILE_H * 0.32,
                      background: "#B9A77C",
                      transform: "translate(-50%, -50%) rotate(45deg) scaleY(0.58)",
                    }}
                  />
                )}
                {isRiver && (
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  >
                    〜
                  </span>
                )}
                {isForest && (
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[80%]"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  >
                    🌲
                  </span>
                )}
                {flooded && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{
                      background: "#4A90D9",
                      opacity: 0.55,
                      transform: "rotate(45deg) scaleY(0.58)",
                      transformOrigin: "center",
                    }}
                  />
                )}
                {showFlow && dir && (
                  <span
                    className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full bg-black/50"
                    style={{
                      width: 22,
                      height: 22,
                      transform: `translate(-50%, -60%) rotate(${directionToDeg(
                        dir.dRow,
                        dir.dCol
                      )}deg)`,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                      <path d="M12 2 L18.5 14 H14.5 V22 H9.5 V14 H5.5 Z" />
                    </svg>
                  </span>
                )}
                {spot && (
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%]"
                    style={{ fontSize: 20 }}
                    aria-hidden="true"
                  >
                    🏠
                  </span>
                )}
                {signal && (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[175%]">
                    <SignalIcon signal={signal} />
                  </span>
                )}
                {spot && protection === "none" && (
                  <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-[230%] flex-col items-center gap-1">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                    <span className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                      {spot.label}
                    </span>
                  </span>
                )}
              </button>
            );
          })
        )}

        {hasEvacuation && (
          <span
            className="absolute z-20 -translate-x-1/2 -translate-y-full text-xl"
            style={{
              left: containerWidth / 2 + (highest.col - highest.row) * (TILE_W / 2),
              top:
                (highest.col + highest.row) * (TILE_H / 2) -
                grid[highest.row][highest.col] * HEIGHT_SCALE +
                70,
            }}
            title="마을 사람들이 대피한 곳"
          >
            🏠
          </span>
        )}
      </div>

      {showRain && (
        <p className="text-sm font-medium text-blue-700" aria-live="polite">
          비가 많이 와요 — {floodedCount}개 지역이 물에 잠겼어요
        </p>
      )}
    </div>
  );
}
