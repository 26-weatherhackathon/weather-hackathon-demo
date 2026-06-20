"use client";

import { useState } from "react";

const QUIZ = [
  {
    q: "기상청 7일 예보 정확도는 약 몇 %인가요?",
    options: ["90%", "78%", "62%", "45%"],
    answer: 2,
  },
  {
    q: "에드워드 로렌츠가 카오스 이론을 발견한 계기는?",
    options: ["슈퍼컴퓨터 오류", "소수점 셋째 자리 생략으로 결과 완전히 달라짐", "위성 데이터 오류", "관측소 위치 오류"],
    answer: 1,
  },
  {
    q: "기상청이 앙상블 예보를 하는 이유는?",
    options: ["컴퓨터가 부족해서", "하나의 예측이 틀릴 수 있어 불확실성을 확률로 표현하기 위해", "예보관이 여러 명이라서", "위성이 여러 개라서"],
    answer: 1,
  },
  {
    q: "기후 예측이 날씨 예측보다 긴 기간을 다룰 수 있는 이유는?",
    options: ["슈퍼컴퓨터가 더 좋아서", "개별 날씨가 아닌 평균 경향성을 다루기 때문", "관측망이 더 촘촘해서", "온실가스가 예측 가능해서"],
    answer: 1,
  },
  {
    q: "구름이 기후 예측에서 '최대 불확실성 요인'인 이유는?",
    options: ["구름이 너무 크기 때문", "구름이 냉각도 하고 온난화도 하는 양방향 효과 때문", "구름 관측이 어렵기 때문", "구름이 갑자기 생기기 때문"],
    answer: 1,
  },
];

export default function Closing() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? QUIZ.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <section id="closing" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">클로징</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          <span style={{ color: "var(--blue)" }}>불확실성을 아는 것</span>이 과학입니다
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          기상청은 "정답"을 맞추는 게 아닙니다.
          얼마나 모르는지 — 그 불확실성을 정직하게 전달하는 것이 목표입니다.
        </p>
      </div>

      {/* 퀴즈 */}
      <div className="card space-y-6 mb-6">
        <p className="font-bold">이해도 확인 퀴즈 ({Object.keys(answers).length}/{QUIZ.length})</p>

        {QUIZ.map((item, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium">
              {qi + 1}. {item.q}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {item.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = submitted && oi === item.answer;
                const isWrong = submitted && isSelected && oi !== item.answer;

                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className="text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: isCorrect
                        ? "#d1fae5"
                        : isWrong
                        ? "#fee2e2"
                        : isSelected
                        ? "var(--blue-light)"
                        : "var(--bg-gray)",
                      color: isCorrect
                        ? "#065f46"
                        : isWrong
                        ? "#991b1b"
                        : isSelected
                        ? "var(--blue-dark)"
                        : "var(--ink-sub)",
                      border: `1.5px solid ${
                        isCorrect ? "#6ee7b7" : isWrong ? "#fca5a5" : isSelected ? "#bfdbfe" : "var(--border)"
                      }`,
                    }}
                  >
                    {isCorrect && "✓ "}
                    {isWrong && "✗ "}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < QUIZ.length}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: Object.keys(answers).length < QUIZ.length ? "var(--border)" : "var(--blue)",
              color: Object.keys(answers).length < QUIZ.length ? "var(--ink-dim)" : "white",
              cursor: Object.keys(answers).length < QUIZ.length ? "not-allowed" : "pointer",
            }}
          >
            제출하기 ({Object.keys(answers).length}/{QUIZ.length} 완료)
          </button>
        ) : (
          <div
            className="p-5 rounded-xl text-center"
            style={{ background: score >= 4 ? "#d1fae5" : "var(--blue-light)" }}
          >
            <p className="text-3xl font-black mb-1" style={{ color: score >= 4 ? "#065f46" : "var(--blue)" }}>
              {score}/{QUIZ.length}
            </p>
            <p className="text-sm" style={{ color: score >= 4 ? "#065f46" : "var(--blue-dark)" }}>
              {score === 5
                ? "완벽합니다! 이제 기상청 예보를 제대로 읽을 수 있습니다."
                : score >= 3
                ? "좋습니다. 다시 읽어보면 100점!"
                : "처음부터 다시 읽어보세요. 대기 과학은 어렵습니다."}
            </p>
          </div>
        )}
      </div>

      {/* 핵심 요약 */}
      <div className="card space-y-3">
        <p className="font-bold text-sm">오늘 배운 것</p>
        {[
          ["1막", "대기는 카오스 — 초기값 차이 0.001이 2주 뒤 완전히 다른 날씨"],
          ["2막", "지구 전체를 완벽히 관측할 수 없다 — 공백은 추정"],
          ["3막", "컴퓨터 격자가 클수록 지형이 사라진다"],
          ["4막", "피드백 루프가 오차를 증폭시킨다"],
          ["5막", "앙상블 = 확률적 예측, '강수 60%'는 가능성의 분포"],
          ["6막", "날씨는 2주 한계, 기후는 평균 경향 — 둘은 다른 문제"],
        ].map(([ch, txt]) => (
          <div key={ch} className="flex gap-3 text-sm">
            <span className="shrink-0 font-bold" style={{ color: "var(--blue)" }}>{ch}</span>
            <span style={{ color: "var(--ink-sub)" }}>{txt}</span>
          </div>
        ))}
      </div>

      {/* 출처 */}
      <p className="mt-8 text-xs" style={{ color: "var(--ink-faint)" }}>
        데이터 출처: 기상청 API허브, 공공데이터포털, 기상자료개방포털 · 참고: IPCC AR6, NOAA Climate.gov
      </p>
    </section>
  );
}
