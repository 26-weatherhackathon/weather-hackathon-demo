"use client";

import { useMemo } from "react";
import {
  createMockDem,
  computeD8Flow,
  elevationToColor,
  isFlooded,
  GRID_ROWS,
  GRID_COLS,
} from "@/lib/dem";

const TILE_W = 56; // 다이아몬드 타일 가로 폭(px)
const TILE_H = 28; // 다이아몬드 타일 세로 폭(px)
const HEIGHT_SCALE = 0.6; // 고도 1m당 타일을 들어올리는 픽셀 수

type Props = {
  showTerrain: boolean;
  showFlow: boolean;
  showRain: boolean;
  rainfallMm: number;
};

// 이웃 방향(dRow, dCol) → 아이소메트릭 화면에서의 회전각(deg)
function directionToDeg(dRow: number, dCol: number): number {
  const angle = Math.atan2(dRow, dCol) * (180 / Math.PI);
  return angle + 90; // 기본 화살표(▲)가 위(북)를 향하므로 90도 보정
}

export default function TerrainView({ showTerrain, showFlow, showRain, rainfallMm }: Props) {
  const grid = useMemo(() => createMockDem(), []);
  const flow = useMemo(() => computeD8Flow(grid), [grid]);

  const floodedCount = useMemo(() => {
    if (!showRain) return 0;
    let count = 0;
    for (const row of grid) {
      for (const elevation of row) {
        if (isFlooded(elevation, rainfallMm)) count++;
      }
    }
    return count;
  }, [grid, showRain, rainfallMm]);

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
            const left =
              containerWidth / 2 + (col - row) * (TILE_W / 2) - TILE_W / 2;
            const top =
              (col + row) * (TILE_H / 2) - elevation * HEIGHT_SCALE + 70;

            const color = showTerrain ? elevationToColor(elevation) : "#c9c9c9";
            const flooded = showRain && isFlooded(elevation, rainfallMm);
            const dir = flow[row][col];

            return (
              <div
                key={`${row}-${col}`}
                className="absolute"
                style={{ left, top, width: TILE_W, height: TILE_H + elevation * HEIGHT_SCALE }}
              >
                {/* 측면(고도만큼 아래로 두께를 준 벽면) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: TILE_H / 2,
                    width: TILE_W * 0.7,
                    height: elevation * HEIGHT_SCALE,
                    background: color,
                    filter: "brightness(0.72)",
                    clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
                  }}
                />
                {/* 윗면(다이아몬드) */}
                <div
                  className="absolute inset-0 border border-black/10"
                  style={{
                    background: color,
                    transform: "rotate(45deg) scaleY(0.58)",
                    transformOrigin: "center",
                  }}
                />
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
                    className="absolute left-1/2 top-1/2 text-[10px] leading-none text-white drop-shadow"
                    style={{
                      transform: `translate(-50%, -60%) rotate(${directionToDeg(
                        dir.dRow,
                        dir.dCol
                      )}deg)`,
                    }}
                  >
                    ▲
                  </span>
                )}
              </div>
            );
          })
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
