"use client";

import IsometricMap from "@/components/IsometricMap";
import { useFloodGame } from "@/game/useFloodGame";
import { PLACEABLE, STRUCTURES, type ToolId } from "@/game/structures";

const CARD =
  "rounded-3xl border border-white/70 bg-white/85 shadow-[0_10px_30px_rgba(80,140,190,0.15)] backdrop-blur-sm";

function StatusDot({ label, tone }: { label: string; tone: "green" | "cyan" }) {
  const color = tone === "green" ? "bg-emerald-400" : "bg-sky-400";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color} shadow-[0_0_8px_currentColor] animate-pulse-glow`}
      />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="text-4xl tracking-widest text-amber-400">
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        {/* 헤더: 기상이 + 오늘의 날씨 */}
        <header
          className={`flex flex-col gap-4 p-5 ${CARD} sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/gisang.png"
                alt="기상이"
                className="h-14 w-14 object-contain"
              />
            </div>
            <div>
              <h1 className="font-jua text-xl text-slate-700 sm:text-2xl">
                우리 마을 홍수 방재 게임
              </h1>
              <p className="text-xs text-slate-400">
                오늘의 날씨 · {g.scenario.name} (강수확률 {g.scenario.precipProb}% ·
                강수량 {g.scenario.rainfall}mm)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatusDot label="시스템 온라인" tone="green" />
            <StatusDot label="기상청 데이터 연결됨" tone="cyan" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* 좌: 게임 보드 */}
          <section className={`relative overflow-hidden ${CARD}`}>
            <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
              <span className="font-jua text-sm text-slate-500">
                {g.phase === "ready"
                  ? "대비 단계 · 시설을 배치하세요"
                  : g.phase === "storm"
                  ? `호우 진행 중 · ${remain}초 남음`
                  : "결과"}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400" />
                예상 최고 수위 {g.peakLevel.toFixed(1)}m
              </span>
            </div>

            {/* 진행 바 */}
            <div className="h-1.5 w-full bg-sky-100">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-rose-400 transition-[width] duration-200"
                style={{ width: `${stormProgress * 100}%` }}
              />
            </div>

            <div className="relative bg-gradient-to-b from-sky-100 to-sky-200">
              <IsometricMap
                grid={g.grid}
                zone={g.zone}
                placed={g.placed}
                level={g.level}
                tool={g.tool}
                interactive={g.phase !== "result"}
                onPlace={g.place}
              />

              {/* 큰 카운트다운 타이머 (호우 중) */}
              {g.phase === "storm" && (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                  <div className="flex items-baseline gap-2 rounded-3xl bg-white/90 px-7 py-3 shadow-[0_8px_24px_rgba(40,90,140,0.2)] backdrop-blur">
                    <span className="text-sm font-semibold text-slate-400">
                      남은 시간
                    </span>
                    <span
                      className={`font-jua text-5xl leading-none ${
                        remain <= 5 ? "text-rose-500" : "text-sky-600"
                      }`}
                    >
                      {remain}
                    </span>
                    <span className="text-lg font-semibold text-slate-400">초</span>
                  </div>
                </div>
              )}
            </div>

            {/* 결과 모달 */}
            {g.result && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      g.result.stars >= 1
                        ? "/img/gisang-happy.png"
                        : "/img/gisang-danger.png"
                    }
                    alt="기상이"
                    className="mx-auto h-24 w-24 animate-pop object-contain"
                  />
                  <h2 className="font-jua mt-2 text-2xl text-slate-700">
                    {g.result.flooded === 0
                      ? "완벽 방어!"
                      : g.result.stars >= 1
                      ? "마을을 지켰어요!"
                      : "마을이 잠겼어요"}
                  </h2>
                  <div className="mt-2 flex justify-center">
                    <Stars n={g.result.stars} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    침수된 건물 {g.result.flooded} / {g.totalHouses}채
                    <br />
                    남은 예산 {g.budget}원
                  </p>
                  <button
                    onClick={g.reset}
                    className="font-jua mt-5 w-full rounded-2xl bg-sky-500 px-4 py-3 text-lg text-white shadow-[0_5px_0_rgba(0,0,0,0.12)] transition active:translate-y-0.5"
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
            <div className={`p-4 ${CARD}`}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">남은 예산</p>
                  <p className="font-jua text-2xl text-emerald-500">
                    {g.budget}
                    <span className="ml-1 text-sm text-slate-400">
                      / {g.startBudget}원
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">안전한 건물</p>
                  <p className="font-jua text-2xl text-slate-700">
                    {safe}
                    <span className="ml-1 text-sm text-slate-400">
                      / {g.totalHouses}
                    </span>
                  </p>
                </div>
              </div>

              {/* 수위 게이지 */}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>현재 수위 {g.level.toFixed(1)}m</span>
                  <span>
                    마을 고도 {g.villageElev.min}~{g.villageElev.max}m
                  </span>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
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
                <p className="mt-1 text-[11px] text-slate-400">
                  물(파랑)이 마을 고도(초록)를 넘으면 침수돼요.
                  {g.basinReduction > 0 && (
                    <span className="text-sky-500">
                      {" "}저류조로 수위 -{g.basinReduction.toFixed(1)}m
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 도구 팔레트 */}
            <div className={`p-4 ${CARD}`}>
              <p className="font-jua mb-2 text-sm text-slate-500">
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
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-sky-300 bg-sky-100 ring-2 ring-sky-200"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="flex-1">
                        <span className="flex items-center justify-between">
                          <span className="font-jua text-sm text-slate-700">
                            {s.name}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              tooPoor ? "text-rose-500" : "text-emerald-500"
                            }`}
                          >
                            {id === "remove" ? "환급" : `${s.cost}원`}
                          </span>
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {s.short}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {STRUCTURES[g.tool].learn && (
                <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-700">
                  💡 {STRUCTURES[g.tool].learn}
                </p>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="flex gap-2">
              {g.phase === "ready" && (
                <button
                  onClick={g.start}
                  className="font-jua flex-1 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 px-4 py-3.5 text-lg text-white shadow-[0_5px_0_rgba(0,0,0,0.12)] transition active:translate-y-0.5"
                >
                  ⛈️ 폭우 시작
                </button>
              )}
              {g.phase === "storm" && (
                <div className="flex-1 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3.5 text-center font-semibold text-slate-500">
                  호우 대응 중… {remain}s
                </div>
              )}
              <button
                onClick={g.reset}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                다시하기
              </button>
            </div>
          </aside>
        </div>

        {/* 학습 안내 */}
        <section className={`p-5 ${CARD}`}>
          <h2 className="font-jua mb-2 text-sm text-slate-500">이렇게 배워요</h2>
          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <p>
              <span className="font-jua text-slate-700">① 고도와 침수</span>
              <br />물은 낮은 곳부터 채워져요. 우리 집 고도와 물 높이를 비교해 위험한 집을 찾아요.
            </p>
            <p>
              <span className="font-jua text-slate-700">② 알맞은 방재</span>
              <br />조금 낮으면 모래주머니, 많이 낮으면 제방, 못 막으면 펌프로 물을 빼요.
            </p>
            <p>
              <span className="font-jua text-slate-700">③ 지역 전체 대응</span>
              <br />빗물 저류조는 마을 전체의 물 높이를 낮춰요. 예산 안에서 똑똑하게 조합해요.
            </p>
          </div>
        </section>

        <footer className="pb-4 text-center text-[11px] text-slate-400">
          2026 기상·기후 AI 해커톤 · 초등학생 대상 기후 위기 대응 학습 콘텐츠 데모
          <br />
          캐릭터: 기상청 기상이(공공누리 제2유형) · 지형: Copernicus GLO-30 DEM
        </footer>
      </div>
    </main>
  );
}
