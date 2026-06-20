"use client";

import { useState } from "react";

const RESOLUTIONS = [
  { label: "100km", gridSize: 4,  ops: "10억",    color: "#ef4444", desc: "1980년대 전지구 모델" },
  { label: "10km",  gridSize: 8,  ops: "1조",     color: "var(--warm)", desc: "현재 기상청 지역 모델" },
  { label: "1km",   gridSize: 16, ops: "1,000조", color: "var(--blue)", desc: "미래 목표 — 도시 단위" },
];

const TERRAIN_RAW = [
  [0,0,0,0, 0,0,1,2, 0,0,0,0, 0,0,0,0],
  [0,0,0,0, 0,1,2,2, 1,0,0,0, 0,0,0,0],
  [0,0,0,1, 1,2,2,2, 2,1,0,0, 0,0,0,0],
  [0,0,1,2, 2,2,2,2, 2,2,1,0, 0,0,0,0],
  [0,1,2,2, 2,2,2,2, 2,2,2,1, 0,0,0,0],
  [0,1,2,2, 2,2,2,1, 2,2,2,1, 0,0,0,0],
  [0,0,1,2, 2,2,1,1, 1,2,2,1, 0,0,0,0],
  [0,0,0,1, 2,2,1,0, 1,2,2,1, 0,0,0,0],
  [0,0,0,1, 2,2,1,0, 0,1,2,1, 0,0,0,0],
  [0,0,0,0, 1,2,1,0, 0,1,2,1, 0,0,0,0],
  [0,0,0,0, 1,2,1,0, 0,0,1,1, 0,0,0,0],
  [0,0,0,0, 0,1,1,0, 0,0,0,1, 0,0,0,0],
  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
];

const TERRAIN_COLORS = ["#1e3a5f", "#1a6b40", "#3a7d2a"];

function downsample(gridSize: number) {
  const block = 16 / gridSize;
  return Array.from({ length: gridSize }, (_, r) =>
    Array.from({ length: gridSize }, (_, c) => {
      let sum = 0;
      for (let dr = 0; dr < block; dr++)
        for (let dc = 0; dc < block; dc++)
          sum += TERRAIN_RAW[r * block + dr]?.[c * block + dc] ?? 0;
      return Math.round(sum / (block * block));
    })
  );
}

export default function Ch3Grid() {
  const [resIdx, setResIdx] = useState(0);
  const res = RESOLUTIONS[resIdx];
  const terrain = downsample(res.gridSize);

  return (
    <section id="ch3" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">3막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          컴퓨터도 지구 전체를 <span style={{ color: "var(--blue)" }}>담을 수 없습니다</span>
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          수치예보 모델은 지구를 격자로 나눕니다. 격자 안은 균일하다고 가정합니다.
          격자가 클수록 태백산맥이 사라지고 — 영동·영서 날씨 차이도 사라집니다.
        </p>
      </div>

      <div className="card space-y-6 mb-6">
        {/* 해상도 탭 */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-gray)" }}>
          {RESOLUTIONS.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setResIdx(i)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: resIdx === i ? "white" : "transparent",
                color: resIdx === i ? r.color : "var(--ink-dim)",
                boxShadow: resIdx === i ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="text-sm" style={{ color: "var(--ink-dim)" }}>{res.desc}</p>

        <div className="flex gap-6 items-start flex-wrap">
          {/* 격자 지형 */}
          <div className="flex-1 min-w-40">
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--ink-dim)" }}>
              태백산맥 단면 ({res.gridSize}×{res.gridSize} 격자)
            </p>
            <div className="viz-inset">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${res.gridSize}, 1fr)`,
                  gap: "1px",
                  background: "#333",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                {terrain.flat().map((v, i) => (
                  <div key={i} style={{ background: TERRAIN_COLORS[v], aspectRatio: "1" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>
              {[["#1e3a5f","바다·평지"],["#1a6b40","낮은 산"],["#3a7d2a","태백산맥"]].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 수치 */}
          <div className="space-y-4 text-sm">
            <div className="card">
              <p style={{ color: "var(--ink-dim)" }}>격자 수</p>
              <p className="text-2xl font-black" style={{ color: res.color }}>
                {(res.gridSize * res.gridSize).toLocaleString()}개
              </p>
            </div>
            <div className="card">
              <p style={{ color: "var(--ink-dim)" }}>초당 필요 연산</p>
              <p className="text-2xl font-black" style={{ color: res.color }}>{res.ops}회</p>
            </div>
          </div>
        </div>

        <div
          className="text-sm p-4 rounded-xl"
          style={{ background: "var(--blue-light)", color: "var(--blue-dark)" }}
        >
          격자 크기 10분의 1 → 연산량 <strong>1,000배</strong> 증가.
          100km 격자에서 태백산맥은 완전히 사라집니다.
        </div>
      </div>
    </section>
  );
}
