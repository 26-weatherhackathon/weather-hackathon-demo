"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// 앙상블 시나리오 시뮬레이션 (실제 중기예보 API 연동 전 데모 데이터)
function generateEnsemble(seed: number, days = 10): number[] {
  const rng = (s: number) => {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  const temps: number[] = [20]; // 오늘 기온 기준
  for (let i = 1; i <= days; i++) {
    const noise = (rng(seed + i * 7.3) - 0.5) * (i * 1.5);
    temps.push(temps[i - 1] + noise + (rng(seed * i) - 0.5) * 0.5);
  }
  return temps;
}

export default function Ch5Ensemble() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [showMean, setShowMean] = useState(true);
  const [memberCount, setMemberCount] = useState(10);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = svgRef.current.clientWidth || 520;
    const H = 260;
    svgRef.current.setAttribute("height", String(H));
    const margin = { top: 16, right: 20, bottom: 32, left: 36 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const days = 10;
    const members = Array.from({ length: memberCount }, (_, i) => generateEnsemble(i * 37.1, days));
    const allTemps = members.flat();

    const xScale = d3.scaleLinear().domain([0, days]).range([0, iW]);
    const yScale = d3.scaleLinear()
      .domain([d3.min(allTemps)! - 1, d3.max(allTemps)! + 1])
      .range([iH, 0]);

    // 그리드
    g.append("g").selectAll("line")
      .data(yScale.ticks(4))
      .join("line")
      .attr("x1", 0).attr("x2", iW)
      .attr("y1", (d) => yScale(d)).attr("y2", (d) => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.08)").attr("stroke-dasharray", "3,3");

    // 앙상블 멤버 선
    const line = d3.line<number>()
      .x((_, i) => xScale(i)).y((d) => yScale(d)).curve(d3.curveCatmullRom);

    members.forEach((m, i) => {
      g.append("path")
        .datum(m)
        .attr("fill", "none")
        .attr("stroke", `rgba(59,158,255,${0.25 + (1 / memberCount) * 0.4})`)
        .attr("stroke-width", 1)
        .attr("d", line);
    });

    // 앙상블 평균
    if (showMean) {
      const meanTemps = Array.from({ length: days + 1 }, (_, i) =>
        d3.mean(members, (m) => m[i])!
      );
      g.append("path")
        .datum(meanTemps)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "none")
        .attr("d", line);
    }

    // x축
    g.append("g")
      .attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(days).tickFormat((d) => `D+${d}`))
      .call((ax) => ax.selectAll("text").attr("fill", "rgba(255,255,255,0.5)").style("font-size", "10px"))
      .call((ax) => ax.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

    // y축
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}°`))
      .call((ax) => ax.selectAll("text").attr("fill", "rgba(255,255,255,0.5)").style("font-size", "10px"))
      .call((ax) => ax.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));
  }, [memberCount, showMean]);

  return (
    <section id="ch5" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">5막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          그래서 기상청은 이렇게 예보합니다 —{" "}
          <span style={{ color: "var(--blue)" }}>앙상블</span>
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          하나의 예측이 아닙니다. 초기값을 조금씩 다르게 한 수십 개의 시나리오를 동시에 돌립니다.
          처음엔 비슷하다가 — 시간이 지날수록 퍼집니다.
        </p>
      </div>

      <div className="card space-y-5 mb-5">
        {/* 컨트롤 */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">앙상블 멤버 수: {memberCount}개</label>
            <input
              type="range" min={3} max={51} step={1} value={memberCount}
              onChange={(e) => setMemberCount(Number(e.target.value))}
              className="w-48 accent-blue-600"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox" checked={showMean}
              onChange={(e) => setShowMean(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <span>앙상블 평균 표시 (흰선)</span>
          </label>
        </div>

        {/* 범례 */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded opacity-50" style={{ background: "var(--cool)" }} />
            <span style={{ color: "var(--ink-sub)" }}>개별 시나리오</span>
          </div>
          {showMean && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded" style={{ background: "white" }} />
              <span style={{ color: "var(--ink-sub)" }}>앙상블 평균</span>
            </div>
          )}
        </div>

        {/* 스파게티 차트 */}
        <div className="viz-inset">
          <svg ref={svgRef} width="100%" />
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          * 데모 시뮬레이션 — 실제 기상청 앙상블은 51개 멤버, 슈퍼컴퓨터 수시간 계산
        </p>
      </div>

      {/* 확률 예보 설명 */}
      <div className="card">
        <p className="text-sm font-bold mb-3">"강수 확률 60%"의 진짜 의미</p>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {[
            { label: "비 온 시나리오", value: "31개", color: "var(--cool)" },
            { label: "비 안 온 시나리오", value: "20개", color: "var(--ink-dim)" },
            { label: "강수 확률", value: "60%", color: "var(--blue)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background: "var(--bg-gray)" }}>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-dim)" }}>{label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-3" style={{ color: "var(--ink-sub)" }}>
          51개 시나리오 중 31개에서 비가 왔다 = 강수 확률 60%.
          "비가 올 것이다" (O/X)가 아니라 <strong>"가능성의 분포"</strong>입니다.
        </p>
      </div>
    </section>
  );
}
