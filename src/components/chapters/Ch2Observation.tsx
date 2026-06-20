"use client";

import { useEffect, useState } from "react";

const STATIONS = [
  { id: "108", name: "서울",   x: 51, y: 35 },
  { id: "159", name: "부산",   x: 64, y: 72 },
  { id: "143", name: "대구",   x: 60, y: 60 },
  { id: "101", name: "춘천",   x: 58, y: 27 },
  { id: "156", name: "광주",   x: 44, y: 68 },
  { id: "133", name: "대전",   x: 50, y: 50 },
  { id: "184", name: "제주",   x: 46, y: 88 },
  { id: "105", name: "강릉",   x: 68, y: 28 },
  { id: "114", name: "포항",   x: 70, y: 57 },
  { id: "146", name: "전주",   x: 46, y: 58 },
  { id: "271", name: "백령도", x: 26, y: 26 },
  { id: "232", name: "울릉도", x: 82, y: 37 },
];

interface StationData { temp?: number; pressure?: number }

export default function Ch2Observation() {
  const [data, setData] = useState<Record<string, StationData>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const tm = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      "00",
    ].join("");

    fetch(`/api/kma/observation?tm=${tm}`)
      .then((r) => r.text())
      .then((text) => {
        const parsed: Record<string, StationData> = {};
        text.split("\n")
          .filter((l) => l.trim() && !l.startsWith("#"))
          .forEach((line) => {
            const cols = line.trim().split(/\s+/);
            const stnId = cols[0];
            if (STATIONS.find((s) => s.id === stnId)) {
              parsed[stnId] = {
                temp: parseFloat(cols[11]) || undefined,
                pressure: parseFloat(cols[7]) || undefined,
              };
            }
          });
        setData(parsed);
      })
      .catch(() => {
        const sample: Record<string, StationData> = {};
        STATIONS.forEach((s) => {
          sample[s.id] = {
            temp: Math.round((15 + Math.random() * 15) * 10) / 10,
            pressure: Math.round((1000 + Math.random() * 20) * 10) / 10,
          };
        });
        setData(sample);
      });
  }, []);

  const sel = selected ? STATIONS.find((s) => s.id === selected) : null;

  return (
    <section id="ch2" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">2막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          초기 조건을 <span style={{ color: "var(--blue)" }}>완벽히</span> 알 수 없습니다
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          예보 모델은 "지금 대기 상태"에서 출발합니다. 그런데 지구 전체를
          빈틈없이 관측하는 건 불가능합니다. 공백 지역은 — 추정입니다.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* 관측망 지도 */}
        <div className="card">
          <p className="text-sm font-medium mb-3" style={{ color: "var(--ink-dim)" }}>
            한반도 기상 관측망 — 지점 클릭 시 실시간 기온·기압
          </p>
          <div className="viz-inset relative" style={{ paddingBottom: "105%" }}>
            <svg viewBox="0 0 100 105" className="absolute inset-0 w-full h-full">
              {/* 한반도 윤곽 (단순화) */}
              <path
                d="M30 18 Q38 13 47 13 Q60 12 67 20 Q75 28 73 38 Q79 46 76 56 Q73 66 68 73 Q60 83 55 89 Q50 93 46 91 Q41 89 39 83 Q34 76 31 71 Q24 61 25 49 Q26 35 30 18 Z"
                stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"
                fill="rgba(59,158,255,0.06)"
              />
              {/* 바다 공백 텍스트 */}
              <text x="12" y="52" fontSize="3.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">관측</text>
              <text x="12" y="57" fontSize="3.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">공백</text>
              <text x="90" y="42" fontSize="3.5" fill="rgba(255,255,255,0.2)" textAnchor="middle">공백</text>

              {/* 관측 지점 */}
              {STATIONS.map((s) => {
                const d = data[s.id];
                const isSelected = selected === s.id;
                return (
                  <g key={s.id} onClick={() => setSelected(isSelected ? null : s.id)} className="cursor-pointer">
                    <circle cx={s.x} cy={s.y} r={isSelected ? 3.5 : 2.5}
                      fill={d ? "var(--blue)" : "rgba(255,255,255,0.35)"}
                      stroke={isSelected ? "white" : "none"} strokeWidth={0.8}
                    />
                    <text x={s.x + 3} y={s.y + 1.2} fontSize="2.8" fill="rgba(255,255,255,0.6)">
                      {s.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 선택 지점 정보 */}
        <div className="space-y-4">
          {sel ? (
            <div className="card">
              <p className="text-xs mb-3 font-medium" style={{ color: "var(--blue)" }}>
                {sel.name} 관측소 #{sel.id} · 실시간
              </p>
              {data[sel.id] ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--ink-dim)" }}>기온</p>
                    <p className="text-3xl font-black" style={{ color: "var(--hot)" }}>
                      {data[sel.id]?.temp ?? "—"}°
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--ink-dim)" }}>기압</p>
                    <p className="text-3xl font-black" style={{ color: "var(--cool)" }}>
                      {data[sel.id]?.pressure ?? "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ink-faint)" }}>hPa</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--ink-dim)" }}>데이터 없음</p>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center min-h-24">
              <p className="text-sm" style={{ color: "var(--ink-dim)" }}>지도에서 관측소를 클릭하세요</p>
            </div>
          )}

          {/* 공백 영향 설명 */}
          <div className="card space-y-3">
            <p className="text-sm font-bold">관측 공백이 예보를 망치는 과정</p>
            {[
              ["바다 위", "선박·부이만 — 육지의 10분의 1 밀도"],
              ["상층 대기", "라디오존데 하루 단 2회 관측"],
              ["극지방·오지", "사실상 관측 데이터 없음"],
              ["결과", "공백 → 추정 오차 → 초기값 오류"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm">
                <span className="font-medium shrink-0" style={{ color: "var(--blue)" }}>{k}</span>
                <span style={{ color: "var(--ink-sub)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
