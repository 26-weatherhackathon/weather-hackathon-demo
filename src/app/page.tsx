"use client";

import IsometricMap from "@/components/IsometricMap";
import { useFloodGame } from "@/game/useFloodGame";
import { PLACEABLE, STRUCTURES, type ToolId } from "@/game/structures";

// 게임 HUD 공통 스타일 (로블록스풍: 두꺼운 흰 테두리 + 딱딱한 바닥 그림자)
const PANEL =
  "rounded-[26px] border-[3px] border-white bg-white shadow-[0_7px_0_rgba(150,190,225,0.5),0_16px_30px_rgba(60,120,180,0.15)]";

function Coin() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-amber-500 bg-amber-200 text-[10px] font-bold text-amber-800">
      ₩
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="text-4xl tracking-widest text-amber-400 drop-shadow-[0_2px_0_rgba(217,119,6,0.4)]">
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
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5">
        {/* ── 상단 HUD ── */}
        <header className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-3 px-4 py-2.5 ${PANEL}`}
            style={{ borderRadius: 26 }}
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/gisang.png"
                alt="기상이"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="font-jua text-base text-slate-700">우리 마을 홍수 방재</p>
              <p className="text-[11px] text-slate-400">
                {g.scenario.name} · 강수확률 {g.scenario.precipProb}% · {g.scenario.rainfall}mm
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* 예산 코인 */}
          <div className="flex items-center gap-2 rounded-full border-[3px] border-white bg-gradient-to-b from-amber-300 to-amber-400 px-4 py-2 shadow-[0_5px_0_rgba(202,138,4,0.55)]">
            <Coin />
            <span className="font-jua text-xl text-amber-900">{g.budget}</span>
          </div>
          {/* 안전한 건물 */}
          <div className="flex items-center gap-2 rounded-full border-[3px] border-white bg-gradient-to-b from-emerald-300 to-emerald-400 px-4 py-2 shadow-[0_5px_0_rgba(5,150,105,0.5)]">
            <span className="text-lg">🏠</span>
            <span className="font-jua text-xl text-emerald-900">
              {safe}/{g.totalHouses}
            </span>
          </div>
        </header>

        {/* ── 게임 보드 ── */}
        <section
          className="relative overflow-hidden border-[4px] border-white bg-sky-100 shadow-[0_10px_0_rgba(150,190,225,0.5),0_22px_40px_rgba(60,120,180,0.2)]"
          style={{ borderRadius: 30 }}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-2.5">
            <span className="font-jua text-sm text-slate-600">
              {g.phase === "ready"
                ? "🛠️ 대비 단계 · 시설을 배치하세요"
                : g.phase === "storm"
                ? "🌧️ 호우 진행 중"
                : "결과"}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-rose-400" />
              예상 최고 수위 {g.peakLevel.toFixed(1)}m
            </span>
          </div>

          <div className="h-2 w-full bg-white/70">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-rose-400 transition-[width] duration-200"
              style={{ width: `${stormProgress * 100}%` }}
            />
          </div>

          <div className="relative">
            <IsometricMap
              grid={g.grid}
              zone={g.zone}
              placed={g.placed}
              level={g.level}
              tool={g.tool}
              interactive={g.phase !== "result"}
              onPlace={g.place}
            />

            {/* 큰 카운트다운 타이머 */}
            {g.phase === "storm" && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
                <div className="flex items-baseline gap-2 rounded-3xl border-[3px] border-white bg-white px-7 py-2.5 shadow-[0_6px_0_rgba(150,190,225,0.6)]">
                  <span className="text-sm font-bold text-slate-400">남은 시간</span>
                  <span
                    className={`font-jua text-5xl leading-none ${
                      remain <= 5 ? "text-rose-500" : "text-sky-600"
                    }`}
                  >
                    {remain}
                  </span>
                  <span className="text-lg font-bold text-slate-400">초</span>
                </div>
              </div>
            )}
          </div>

          {/* 결과 모달 */}
          {g.result && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div
                className="mx-4 w-full max-w-sm border-[4px] border-white bg-white p-6 text-center shadow-2xl"
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
                  className="font-jua mt-5 w-full rounded-2xl border-[3px] border-white bg-gradient-to-b from-sky-400 to-sky-500 px-4 py-3 text-lg text-white shadow-[0_6px_0_#2f6fb0] transition active:translate-y-1 active:shadow-[0_2px_0_#2f6fb0]"
                >
                  다시 도전하기
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── 수위 게이지 ── */}
        <div className={`px-5 py-3 ${PANEL}`}>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
            <span>현재 수위 {g.level.toFixed(1)}m</span>
            <span>
              마을 고도 {g.villageElev.min}~{g.villageElev.max}m
            </span>
          </div>
          <div className="relative h-5 w-full overflow-hidden rounded-full border-2 border-slate-100 bg-slate-100">
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
          <p className="mt-1.5 text-[11px] text-slate-400">
            물(파랑)이 마을 고도(초록)를 넘으면 침수돼요.
            {g.basinReduction > 0 && (
              <span className="font-bold text-sky-500">
                {" "}저류조로 수위 -{g.basinReduction.toFixed(1)}m
              </span>
            )}
          </p>
        </div>

        {/* ── 하단 액션 바: 도구 핫바 ── */}
        <div className={`p-3.5 ${PANEL}`}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-jua text-sm text-slate-600">
              🧰 방재 시설 {g.phase !== "result" && "· 골라서 지도에 설치"}
            </span>
            {STRUCTURES[g.tool].learn && (
              <span className="hidden max-w-[55%] truncate rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700 sm:inline">
                💡 {STRUCTURES[g.tool].learn}
              </span>
            )}
          </div>

          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
            {PLACEABLE.map((id: ToolId) => {
              const s = STRUCTURES[id];
              const selected = g.tool === id;
              const tooPoor = id !== "remove" && g.budget < s.cost;
              return (
                <button
                  key={id}
                  onClick={() => g.setTool(id)}
                  className={`flex w-[118px] shrink-0 flex-col items-center gap-1 rounded-2xl border-[3px] px-2 py-2.5 transition ${
                    selected
                      ? "-translate-y-1 border-amber-400 bg-amber-50 shadow-[0_6px_0_rgba(251,191,36,0.5)]"
                      : "border-slate-200 bg-white shadow-[0_4px_0_rgba(180,200,220,0.5)] hover:-translate-y-0.5"
                  }`}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="font-jua text-[13px] text-slate-700">{s.name}</span>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-bold ${
                      tooPoor ? "text-rose-500" : "text-amber-600"
                    }`}
                  >
                    {id === "remove" ? "환급" : (<><Coin />{s.cost}</>)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 시작 / 다시 */}
          <div className="mt-3 flex gap-2.5">
            {g.phase === "ready" && (
              <button
                onClick={g.start}
                className="font-jua flex-1 rounded-2xl border-[3px] border-white bg-gradient-to-b from-rose-400 to-orange-500 px-4 py-3.5 text-xl text-white shadow-[0_6px_0_#c2410c] transition active:translate-y-1 active:shadow-[0_2px_0_#c2410c]"
              >
                ⛈️ 폭우 시작!
              </button>
            )}
            {g.phase === "storm" && (
              <div className="flex-1 rounded-2xl border-[3px] border-sky-100 bg-sky-50 px-4 py-3.5 text-center font-jua text-lg text-slate-500">
                호우 대응 중… {remain}s
              </div>
            )}
            <button
              onClick={g.reset}
              className="font-jua rounded-2xl border-[3px] border-slate-200 bg-white px-5 py-3.5 text-lg text-slate-500 shadow-[0_5px_0_rgba(180,200,220,0.5)] transition active:translate-y-1"
            >
              다시하기
            </button>
          </div>
        </div>

        {/* ── 학습 안내 ── */}
        <section className={`px-5 py-4 ${PANEL}`}>
          <h2 className="font-jua mb-2 text-sm text-slate-600">📚 이렇게 배워요</h2>
          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <p>
              <span className="font-jua text-slate-700">① 고도와 침수</span>
              <br />물은 낮은 곳부터 채워져요. 우리 집 고도와 물 높이를 비교해요.
            </p>
            <p>
              <span className="font-jua text-slate-700">② 알맞은 방재</span>
              <br />조금 낮으면 모래주머니, 많이 낮으면 제방, 못 막으면 펌프!
            </p>
            <p>
              <span className="font-jua text-slate-700">③ 지역 전체 대응</span>
              <br />빗물 저류조는 마을 전체 물 높이를 낮춰요. 예산 안에서 똑똑하게!
            </p>
          </div>
        </section>

        <footer className="pb-4 text-center text-[11px] text-slate-400">
          2026 기상·기후 AI 해커톤 · 캐릭터: 기상청 기상이(공공누리 제2유형) · 지형: Copernicus GLO-30 DEM
        </footer>
      </div>
    </main>
  );
}
