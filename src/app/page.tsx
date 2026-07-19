"use client";

import IsometricMap from "@/components/IsometricMap";
import { useFloodGame } from "@/game/useFloodGame";
import { PLACEABLE, STRUCTURES, type ToolId } from "@/game/structures";

// 게임 HUD 공통 스타일 (로블록스풍: 두꺼운 흰 테두리 + 딱딱한 바닥 그림자)
const PANEL =
  "rounded-[24px] border-[3px] border-white bg-white shadow-[0_7px_0_rgba(150,190,225,0.5),0_16px_28px_rgba(60,120,180,0.14)]";

function Coin({ size = 22 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full border-2 border-amber-500 bg-amber-200 font-bold text-amber-800"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      ₩
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="text-5xl tracking-widest text-amber-400 drop-shadow-[0_2px_0_rgba(217,119,6,0.4)]">
      {"★★★".slice(0, n)}
      <span className="text-slate-200">{"★★★".slice(n)}</span>
    </div>
  );
}

export default function Home() {
  const g = useFloodGame();

  const stormProgress = Math.min(1, g.elapsed / g.duration);
  const remain = Math.max(0, Math.ceil(g.duration - g.elapsed));

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
    <main className="flex h-screen flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col gap-3 px-6 py-4">
        {/* ── 상단 HUD ── */}
        <header className="flex shrink-0 items-center gap-3">
          <div className={`flex items-center gap-3 px-5 py-3 ${PANEL}`}>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/gisang.png"
                alt="기상이"
                className="h-11 w-11 object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="font-jua text-lg text-slate-700">우리 마을 홍수 방재</p>
              <p className="text-xs text-slate-400">
                {g.scenario.name} · 강수확률 {g.scenario.precipProb}% ·{" "}
                {g.scenario.rainfall}mm
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2.5 rounded-full border-[3px] border-white bg-gradient-to-b from-amber-300 to-amber-400 px-5 py-2.5 shadow-[0_5px_0_rgba(202,138,4,0.55)]">
            <Coin size={26} />
            <span className="font-jua text-2xl text-amber-900">{g.budget}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border-[3px] border-white bg-gradient-to-b from-emerald-300 to-emerald-400 px-5 py-2.5 shadow-[0_5px_0_rgba(5,150,105,0.5)]">
            <span className="text-xl">🏠</span>
            <span className="font-jua text-2xl text-emerald-900">
              {safe}/{g.totalHouses}
            </span>
          </div>
        </header>

        {/* ── 본문: 좌 게임판 / 우 컨트롤 (한 화면) ── */}
        <div className="flex min-h-0 flex-1 gap-4">
          {/* 게임판 */}
          <section
            className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-[4px] border-white bg-sky-100 shadow-[0_9px_0_rgba(150,190,225,0.5),0_20px_36px_rgba(60,120,180,0.2)]"
            style={{ borderRadius: 28 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
              <span className="font-jua text-base text-slate-600">
                {g.phase === "ready"
                  ? "🛠️ 대비 단계 · 시설을 배치하세요"
                  : g.phase === "storm"
                  ? "🌧️ 호우 진행 중"
                  : "결과"}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-rose-500">
                <span className="h-2.5 w-2.5 animate-pulse-glow rounded-full bg-rose-400" />
                예상 최고 수위 {g.peakLevel.toFixed(1)}m
              </span>
            </div>

            <div className="h-2 w-full shrink-0 bg-white/70">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-rose-400 transition-[width] duration-200"
                style={{ width: `${stormProgress * 100}%` }}
              />
            </div>

            <div className="relative flex min-h-0 flex-1 justify-center overflow-hidden">
              <div className="mx-auto h-full" style={{ aspectRatio: "860 / 620" }}>
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

              {g.phase === "storm" && (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                  <div className="flex items-baseline gap-2 rounded-3xl border-[3px] border-white bg-white px-8 py-3 shadow-[0_6px_0_rgba(150,190,225,0.6)]">
                    <span className="text-base font-bold text-slate-400">남은 시간</span>
                    <span
                      className={`font-jua text-6xl leading-none ${
                        remain <= 5 ? "text-rose-500" : "text-sky-600"
                      }`}
                    >
                      {remain}
                    </span>
                    <span className="text-xl font-bold text-slate-400">초</span>
                  </div>
                </div>
              )}
            </div>

            {/* 결과 모달 */}
            {g.result && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div
                  className="mx-4 w-full max-w-sm border-[4px] border-white bg-white p-7 text-center shadow-2xl"
                  style={{ borderRadius: 28 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      g.result.stars >= 1
                        ? "/img/gisang-happy.png"
                        : "/img/gisang-danger.png"
                    }
                    alt="기상이"
                    className="mx-auto h-28 w-28 animate-pop object-contain"
                  />
                  <h2 className="font-jua mt-2 text-3xl text-slate-700">
                    {g.result.flooded === 0
                      ? "완벽 방어!"
                      : g.result.stars >= 1
                      ? "마을을 지켰어요!"
                      : "마을이 잠겼어요"}
                  </h2>
                  <div className="mt-3 flex justify-center">
                    <Stars n={g.result.stars} />
                  </div>
                  <p className="mt-3 text-base text-slate-500">
                    침수된 건물 {g.result.flooded} / {g.totalHouses}채 · 남은 예산{" "}
                    {g.budget}원
                  </p>
                  <button
                    onClick={g.reset}
                    className="font-jua mt-5 w-full rounded-2xl border-[3px] border-white bg-gradient-to-b from-sky-400 to-sky-500 px-4 py-3.5 text-xl text-white shadow-[0_6px_0_#2f6fb0] transition active:translate-y-1 active:shadow-[0_2px_0_#2f6fb0]"
                  >
                    다시 도전하기
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 우측 컨트롤 (한 화면 고정) */}
          <aside className="flex w-[380px] shrink-0 flex-col gap-3">
            {/* 수위 게이지 */}
            <div className={`shrink-0 px-5 py-4 ${PANEL}`}>
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
                <span>현재 수위 {g.level.toFixed(1)}m</span>
                <span>
                  마을 고도 {g.villageElev.min}~{g.villageElev.max}m
                </span>
              </div>
              <div className="relative h-6 w-full overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100">
                <div
                  className="absolute top-0 h-full bg-emerald-400/40"
                  style={{
                    left: `${Math.max(0, villageMinPct)}%`,
                    width: `${Math.max(2, villageMaxPct - villageMinPct)}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-[width] duration-200"
                  style={{ width: `${levelPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                물(파랑)이 마을 고도(초록)를 넘으면 침수돼요.
                {g.basinReduction > 0 && (
                  <span className="font-bold text-sky-500">
                    {" "}저류조로 수위 -{g.basinReduction.toFixed(1)}m
                  </span>
                )}
              </p>
            </div>

            {/* 도구 팔레트 */}
            <div className={`flex min-h-0 flex-1 flex-col px-5 py-4 ${PANEL}`}>
              <p className="font-jua mb-3 text-base text-slate-600">
                🧰 방재 시설 {g.phase !== "result" && "· 골라서 지도에 설치"}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {PLACEABLE.map((id: ToolId) => {
                  const s = STRUCTURES[id];
                  const selected = g.tool === id;
                  const tooPoor = id !== "remove" && g.budget < s.cost;
                  return (
                    <button
                      key={id}
                      onClick={() => g.setTool(id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-[3px] px-2 py-3 transition ${
                        selected
                          ? "-translate-y-0.5 border-amber-400 bg-amber-50 shadow-[0_6px_0_rgba(251,191,36,0.5)]"
                          : "border-slate-200 bg-white shadow-[0_4px_0_rgba(180,200,220,0.5)] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="text-4xl">{s.emoji}</span>
                      <span className="font-jua text-sm text-slate-700">{s.name}</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold ${
                          tooPoor ? "text-rose-500" : "text-amber-600"
                        }`}
                      >
                        {id === "remove" ? "환급" : (<><Coin size={16} />{s.cost}</>)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {STRUCTURES[g.tool].learn && (
                <p className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-700">
                  💡 {STRUCTURES[g.tool].learn}
                </p>
              )}

              <div className="mt-auto flex gap-2.5 pt-3">
                {g.phase === "ready" && (
                  <button
                    onClick={g.start}
                    className="font-jua flex-1 rounded-2xl border-[3px] border-white bg-gradient-to-b from-rose-400 to-orange-500 px-4 py-4 text-2xl text-white shadow-[0_6px_0_#c2410c] transition active:translate-y-1 active:shadow-[0_2px_0_#c2410c]"
                  >
                    ⛈️ 폭우 시작!
                  </button>
                )}
                {g.phase === "storm" && (
                  <div className="flex-1 rounded-2xl border-[3px] border-sky-100 bg-sky-50 px-4 py-4 text-center font-jua text-xl text-slate-500">
                    호우 대응 중… {remain}s
                  </div>
                )}
                <button
                  onClick={g.reset}
                  className="font-jua rounded-2xl border-[3px] border-slate-200 bg-white px-5 py-4 text-lg text-slate-500 shadow-[0_5px_0_rgba(180,200,220,0.5)] transition active:translate-y-1"
                >
                  다시하기
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
