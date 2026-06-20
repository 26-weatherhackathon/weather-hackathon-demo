"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function lorenzStep(x: number, y: number, z: number, dt = 0.005) {
  const sigma = 10, rho = 28, beta = 8 / 3;
  return {
    x: x + sigma * (y - x) * dt,
    y: y + (x * (rho - z) - y) * dt,
    z: z + (x * y - beta * z) * dt,
  };
}

function generatePath(x0: number, steps = 2500) {
  const pts: [number, number][] = [];
  let { x, y, z } = { x: x0, y: 0, z: 20 };
  for (let i = 0; i < steps; i++) {
    const next = lorenzStep(x, y, z);
    pts.push([next.x, next.z]);
    ({ x, y, z } = next);
  }
  return pts;
}

export default function Ch1Chaos() {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const [delta, setDelta] = useState(0.01);
  const [divergedAt, setDivergedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    setDivergedAt(null);

    const W = svgRef.current.clientWidth || 560;
    const H = 280;
    svgRef.current.setAttribute("height", String(H));

    const path1 = generatePath(0.1);
    const path2 = generatePath(0.1 + delta);

    const allX = [...path1, ...path2].map((d) => d[0]);
    const allY = [...path1, ...path2].map((d) => d[1]);
    const xScale = d3.scaleLinear().domain([d3.min(allX)!, d3.max(allX)!]).range([16, W - 16]);
    const yScale = d3.scaleLinear().domain([d3.min(allY)!, d3.max(allY)!]).range([H - 16, 16]);
    const line = d3.line<[number, number]>().x((d) => xScale(d[0])).y((d) => yScale(d[1])).curve(d3.curveCatmullRom);

    const p2El = svg.append("path").attr("fill","none").attr("stroke","var(--hot)").attr("stroke-width","1.5").attr("opacity","0.85");
    const p1El = svg.append("path").attr("fill","none").attr("stroke","var(--blue)").attr("stroke-width","1.5").attr("opacity","0.85");

    let cur = 0;
    const total = path1.length;
    let diverged = false;

    function animate() {
      cur = Math.min(cur + 10, total);
      p1El.attr("d", line(path1.slice(0, cur)));
      p2El.attr("d", line(path2.slice(0, cur)));

      if (!diverged && cur > 100) {
        const [x1] = path1[cur - 1];
        const [x2] = path2[cur - 1];
        if (Math.abs(x1 - x2) > 5) {
          diverged = true;
          setDivergedAt(Math.round((cur / total) * 100));
        }
      }

      if (cur < total) animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [delta]);

  return (
    <section id="ch1" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">1막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          대기는 <span style={{ color: "var(--blue)" }}>카오스</span> 시스템입니다
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          1963년 기상학자 에드워드 로렌츠가 발견했습니다.
          초기값 차이 0.001 — 경로가 완전히 달라집니다. 나비효과의 정체입니다.
        </p>
      </div>

      <div className="card space-y-5 mb-6">
        {/* 슬라이더 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">초기값 차이 (Δx)</p>
            <span className="font-mono text-sm font-bold" style={{ color: "var(--blue)" }}>
              {delta.toFixed(4)}
            </span>
          </div>
          <input
            type="range" min={0.0001} max={0.1} step={0.0001} value={delta}
            onChange={(e) => { cancelAnimationFrame(animRef.current); setDelta(Number(e.target.value)); }}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs" style={{ color: "var(--ink-faint)" }}>
            <span>0.0001 (나비 한 마리)</span>
            <span>0.1 (태풍 1개 차이)</span>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ background: "var(--blue)" }} />
            <span style={{ color: "var(--ink-sub)" }}>경로 A (기준)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ background: "var(--hot)" }} />
            <span style={{ color: "var(--ink-sub)" }}>경로 B (초기값 +Δx)</span>
          </div>
        </div>

        {/* 로렌츠 어트랙터 시각화 */}
        <div className="viz-inset">
          <svg ref={svgRef} width="100%" />
        </div>

        {divergedAt !== null && (
          <div
            className="text-sm p-3 rounded-lg font-medium"
            style={{ background: "#fff1f2", color: "var(--hot)", border: "1px solid #fecdd3" }}
          >
            진행 {divergedAt}% 시점에서 두 경로가 완전히 갈라졌습니다.
            초기값 차이 {delta.toFixed(4)} → 예측 불가능한 결과
          </div>
        )}
      </div>

      {/* 통계 카드 3개 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "예보 정확 한계", value: "2주", color: "var(--hot)" },
          { label: "로렌츠 발견", value: "1963년", color: "var(--blue)" },
          { label: "대기 변수 수", value: "수백만", color: "var(--green)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--ink-dim)" }}>{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
