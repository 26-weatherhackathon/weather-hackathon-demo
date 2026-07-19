"use client";

import IsometricMap from "@/components/IsometricMap";
import { useFloodGame } from "@/game/useFloodGame";
import { PLACEABLE, STRUCTURES, type ToolId } from "@/game/structures";

function StatusDot({ label, tone }: { label: string; tone: "green" | "cyan" }) {
  const color = tone === "green" ? "bg-emerald-400" : "bg-cyan-400";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color} shadow-[0_0_8px_currentColor] animate-pulse-glow`}
      />
      <span className="text-xs font-medium text-white/80">{label}</span>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="text-3xl tracking-widest">
      {"★★★".slice(0, n)}
      <span className="text-white/25">{"★★★".slice(n)}</span>
    </div>
  );
}

export default function Home() {
  const g = useFloodGame();

  const stormProgress = Math.min(1, g.elapsed / g.duration);
  const remain = Math.max(0, Math.ceil(g.duration - g.elapsed));

  // 수위 게이지: BASE(3) ~ 시나리오 최고 수위 범위
  const gaugeMin = 3;
  const gaugeMax = g.scenario.peakLevel + 1;
  const levelPct = Math.max(
    0,
    Math.min(100, ((g.level - gaugeMin) / (gaugeMax - gaugeMin)) * 100)
  );
  const villageMinPct = ((g.villageElev.min - gaugeMin) / (gaugeMax - gaugeMin)) * 100;
  const villageMaxPct = ((g.villageElev.max - gaugeMin) / (gaugeMax - gaugeMin)) * 100;

  const safe = g.totalHouses - g.floodedNow;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        {/* 헤더 HUD */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-2xl shadow-lg">
              🏘️
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                우리 마을 홍수 방재 게임
              </h1>
              <p className="text-xs text-white/60">
                시나리오 · {g.scenario.name} (강수확률 {g.scenario.precipProb}% · 강수량{" "}
                {g.scenario.rainfall}mm)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatusDot label="시스템 온라인" tone="green" />
            <StatusDot label="기상청 API 연결됨" tone="cyan" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* 좌: 게임 보드 */}
          <section className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {g.phase === "ready"
                  ? "대비 단계 · 시설을 배치하세요"
                  : g.phase === "storm"
                  ? `호우 진행 중 · ${remain}초 남음`
                  : "결과"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400" />
                예상 최고 수위 {g.peakLevel.toFixed(1)}m
              </span>
            </div>

            {/* 진행 바 */}
            <div className="h-1 w-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-rose-400 transition-[width] duration-200"
                style={{ width: `${stormProgress * 100}%` }}
              />
            </div>

            <div className="bg-slate-950">
              <IsometricMap
                grid={g.grid}
                zone={g.zone}
                placed={g.placed}
                level={g.level}
                tool={g.tool}
                interactive={g.phase !== "result"}
                onPlace={g.place}
              />
            </div>

            {/* 결과 모달 */}
            {g.result && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-6 text-center shadow-2xl">
                  <p className="text-sm font-medium text-white/60">호우 종료</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {g.result.flooded === 0
                      ? "완벽 방어! 🎉"
                      : g.result.stars >= 1
                      ? "마을을 지켰어요!"
                      : "마을이 잠겼어요 😢"}
                  </h2>
                  <div className="mt-3 flex justify-center">
                    <Stars n={g.result.stars} />
                  </div>
                  <p className="mt-3 text-sm text-white/70">
                    침수된 건물 {g.result.flooded} / {g.totalHouses}채
                    <br />
                    남은 예산 {g.budget}원
                  </p>
                  <button
                    onClick={g.reset}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 font-semibold text-slate-900 shadow-lg transition hover:brightness-110"
                  >
                    다시 도전하기
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 우: 컨트롤 패널 */}
          <aside className="flex flex-col gap-4">
            {/* 예산 + 통계 */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/50">남은 예산</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {g.budget}
                    <span className="ml-1 text-sm font-normal text-white/50">
                      / {g.startBudget}원
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">안전한 건물</p>
                  <p className="text-2xl font-bold text-white">
                    {safe}
                    <span className="ml-1 text-sm font-normal text-white/50">
                      / {g.totalHouses}
                    </span>
                  </p>
                </div>
              </div>

              {/* 수위 게이지 */}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-white/50">
                  <span>현재 수위 {g.level.toFixed(1)}m</span>
                  <span>마을 고도 {g.villageElev.min}~{g.villageElev.max}m</span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  {/* 마을 고도 밴드 */}
                  <div
                    className="absolute top-0 h-full bg-emerald-500/25"
                    style={{
                      left: `${Math.max(0, villageMinPct)}%`,
                      width: `${Math.max(2, villageMaxPct - villageMinPct)}%`,
                    }}
                  />
                  {/* 물 */}
                  <div
                    className="absolute top-0 h-full bg-gradient-to-r from-cyan-500/70 to-blue-500/70 transition-[width] duration-200"
                    style={{ width: `${levelPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-white/45">
                  물(파랑)이 마을 고도(초록)를 넘으면 침수돼요.
                  {g.basinReduction > 0 && (
                    <span className="text-cyan-300">
                      {" "}저류조로 수위 -{g.basinReduction.toFixed(1)}m
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 도구 팔레트 */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                방재 시설 {g.phase !== "result" && "· 선택 후 지도 클릭"}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PLACEABLE.map((id: ToolId) => {
                  const s = STRUCTURES[id];
                  const selected = g.tool === id;
                  const tooPoor = id !== "remove" && g.budget < s.cost;
                  return (
                    <button
                      key={id}
                      onClick={() => g.setTool(id)}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                        selected
                          ? "border-cyan-400/70 bg-cyan-400/15 ring-1 ring-cyan-400/50"
                          : "border-white/10 bg-black/20 hover:bg-black/30"
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="flex-1">
                        <span className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">
                            {s.name}
                          </span>
                          <span
                            className={`text-xs ${
                              tooPoor ? "text-rose-400" : "text-emerald-300"
                            }`}
                          >
                            {id === "remove" ? "환급" : `${s.cost}원`}
                          </span>
                        </span>
                        <span className="block text-[11px] text-white/50">
                          {s.short}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* 선택 도구 학습 팁 */}
              {STRUCTURES[g.tool].learn && (
                <p className="mt-3 rounded-lg bg-cyan-400/10 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
                  💡 {STRUCTURES[g.tool].learn}
                </p>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="flex gap-2">
              {g.phase === "ready" && (
                <button
                  onClick={g.start}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-3 font-bold text-white shadow-lg transition hover:brightness-110"
                >
                  ⛈️ 폭우 시작
                </button>
              )}
              {g.phase === "storm" && (
                <div className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-semibold text-white/80">
                  호우 대응 중… {remain}s
                </div>
              )}
              <button
                onClick={g.reset}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/10"
              >
                다시하기
              </button>
            </div>
          </aside>
        </div>

        {/* 학습 안내 */}
        <section className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            학습 목표 · 이렇게 배워요
          </h2>
          <div className="grid gap-3 text-xs text-white/70 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-white">① 고도와 침수</span>
              <br />물은 낮은 곳부터 채워져요. 우리 집 고도와 물 높이를 비교해 위험한 집을 찾아요.
            </p>
            <p>
              <span className="font-semibold text-white">② 알맞은 방재</span>
              <br />조금 낮으면 모래주머니, 많이 낮으면 제방, 못 막으면 펌프로 물을 빼요.
            </p>
            <p>
              <span className="font-semibold text-white">③ 지역 전체 대응</span>
              <br />빗물 저류조는 마을 전체의 물 높이를 낮춰요. 예산 안에서 똑똑하게 조합해요.
            </p>
          </div>
        </section>

        <footer className="pb-4 text-center text-[11px] text-white/40">
          2026 기상·기후 AI 해커톤 · 초등학생 대상 기후 위기 대응 학습 콘텐츠 데모
        </footer>
      </div>
    </main>
  );
}
