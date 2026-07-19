"use client";

import { useEffect, useState } from "react";
import IsometricMap from "@/components/IsometricMap";
import { TERRAIN_COLORS } from "@/utils/terrain";

const LEGEND: { label: string; range: string; color: string }[] = [
  { label: "산 · 고지대", range: "100m↑", color: TERRAIN_COLORS.mountain },
  { label: "완만한 경사지", range: "30~100m", color: TERRAIN_COLORS.hill },
  { label: "평지 · 마을", range: "10~30m", color: TERRAIN_COLORS.plain },
  { label: "저지대 · 하천", range: "10m↓", color: TERRAIN_COLORS.water },
];

function StatusDot({ label, tone }: { label: string; tone: "green" | "cyan" }) {
  const color = tone === "green" ? "bg-emerald-400" : "bg-cyan-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color} shadow-[0_0_8px_currentColor] animate-pulse-glow`} />
      <span className="text-xs font-medium text-white/80">{label}</span>
    </div>
  );
}

export default function Home() {
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("ko-KR", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* 배경 글로우 레이어 */}
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
        {/* 글래스모피즘 HUD 헤더 */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-2xl shadow-lg">
              🌊
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                우리 마을 홍수 방재 게임
              </h1>
              <p className="text-xs text-white/60">
                기상청 실데이터 기반 아이소메트릭 호우 시뮬레이션
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatusDot label="시스템 온라인" tone="green" />
            <StatusDot label="기상청 API 연결됨" tone="cyan" />
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 font-mono text-sm text-cyan-300">
              {clock}
            </div>
          </div>
        </header>

        {/* 메인 렌더링 캔버스 카드 */}
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              LIVE · 분지형 하천 마을 (30 × 30 DEM)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400" />
              호우 경보 시뮬레이션
            </span>
          </div>
          <div className="bg-slate-950">
            <IsometricMap />
          </div>
        </section>

        {/* 고도 범례 */}
        <section className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            고도별 지형 (DEM 그래디언트)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LEGEND.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-md ring-1 ring-white/20"
                  style={{ backgroundColor: item.color }}
                />
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white/90">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-white/50">{item.range}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pb-4 text-center text-[11px] text-white/40">
          2026 기상·기후 AI 해커톤 · 초등학생 대상 기후 위기 대응 학습 콘텐츠 데모
        </footer>
      </div>
    </main>
  );
}
