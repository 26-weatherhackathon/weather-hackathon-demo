"use client";

import { useState } from "react";

const CHAIN = [
  { id: "ice",   label: "북극 해빙 감소", icon: "🧊", color: "#60a5fa" },
  { id: "alb",   label: "알베도 감소 (반사율 ↓)", icon: "☀️", color: "#fbbf24" },
  { id: "temp",  label: "해수 온도 상승", icon: "🌡️", color: "#f97316" },
  { id: "more",  label: "해빙 더 빨리 녹음", icon: "💧", color: "#ef4444" },
  { id: "loop",  label: "다시 처음으로 →", icon: "🔁", color: "#a855f7" },
];

const CLOUD_TYPES = [
  {
    type: "low",
    label: "저층운 (층운·적운)",
    altitude: "0~2km",
    effect: "냉각",
    desc: "햇빛을 반사 → 지표 온도 낮춤",
    color: "#3b82f6",
    icon: "❄️",
  },
  {
    type: "high",
    label: "고층운 (권운)",
    altitude: "6km↑",
    effect: "온난화",
    desc: "지표 복사 흡수 → 온실효과 강화",
    color: "var(--hot)",
    icon: "🔥",
  },
];

export default function Ch4Feedback() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [cloudType, setCloudType] = useState<"low" | "high">("low");
  const cloud = CLOUD_TYPES.find((c) => c.type === cloudType)!;

  return (
    <section id="ch4" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">4막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          피드백 루프가 <span style={{ color: "var(--blue)" }}>결과를 뒤튼다</span>
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          대기·해양·빙권은 서로 연결되어 있습니다. 한 요소의 변화가
          다른 요소를 바꾸고, 다시 처음으로 돌아옵니다. 이 루프가 예측을 어렵게 합니다.
        </p>
      </div>

      {/* 얼음-알베도 피드백 도미노 */}
      <div className="card mb-5">
        <p className="text-sm font-bold mb-4">양성 피드백 루프 — 직접 눌러보세요</p>
        <div className="flex flex-wrap gap-2 items-center">
          {CHAIN.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                className="flex flex-col items-center p-3 rounded-xl text-center transition-all"
                style={{
                  background: activeStep === i ? step.color + "20" : "var(--bg-gray)",
                  border: `2px solid ${activeStep === i ? step.color : "var(--border)"}`,
                  minWidth: "80px",
                }}
              >
                <span className="text-2xl mb-1">{step.icon}</span>
                <span className="text-xs font-medium leading-tight" style={{ color: "var(--ink-sub)" }}>
                  {step.label}
                </span>
              </button>
              {i < CHAIN.length - 1 && (
                <span className="text-lg" style={{ color: "var(--ink-faint)" }}>→</span>
              )}
            </div>
          ))}
        </div>

        {activeStep !== null && (
          <div
            className="mt-4 p-3 rounded-xl text-sm"
            style={{ background: CHAIN[activeStep].color + "15", color: "var(--ink-sub)" }}
          >
            <strong style={{ color: CHAIN[activeStep].color }}>{CHAIN[activeStep].label}</strong>가
            강화되면 다음 단계를 더욱 가속합니다. 이것이 양성 피드백 — 예측 오차를 증폭시킵니다.
          </div>
        )}
      </div>

      {/* 구름의 딜레마 */}
      <div className="card">
        <p className="text-sm font-bold mb-4">구름의 딜레마 — 냉각? 온난화?</p>

        <div className="flex gap-2 p-1 rounded-xl mb-5" style={{ background: "var(--bg-gray)" }}>
          {CLOUD_TYPES.map((c) => (
            <button
              key={c.type}
              onClick={() => setCloudType(c.type as "low" | "high")}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: cloudType === c.type ? "white" : "transparent",
                color: cloudType === c.type ? c.color : "var(--ink-dim)",
                boxShadow: cloudType === c.type ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl mb-1">{cloudType === "low" ? "☁️" : "🌤️"}</p>
            <p className="text-xs" style={{ color: "var(--ink-dim)" }}>고도</p>
            <p className="font-bold" style={{ color: cloud.color }}>{cloud.altitude}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl mb-1">{cloud.icon}</p>
            <p className="text-xs" style={{ color: "var(--ink-dim)" }}>효과</p>
            <p className="font-bold" style={{ color: cloud.color }}>{cloud.effect}</p>
          </div>
          <div className="card col-span-1 md:col-span-1">
            <p className="text-xs" style={{ color: "var(--ink-dim)" }}>메커니즘</p>
            <p className="text-sm font-medium mt-1" style={{ color: "var(--ink-sub)" }}>{cloud.desc}</p>
          </div>
        </div>

        <div
          className="mt-4 p-3 rounded-xl text-sm"
          style={{ background: "var(--blue-light)", color: "var(--blue-dark)" }}
        >
          구름은 양방향으로 작동합니다. 기후 모델마다 구름 처리 방식이 달라 — 최대 불확실성 원인입니다.
          IPCC는 구름을 "가장 큰 미해결 문제"로 꼽습니다.
        </div>
      </div>
    </section>
  );
}
