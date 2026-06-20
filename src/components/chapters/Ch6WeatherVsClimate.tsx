"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Open-Meteo ERA5 재분석 데이터 기반 실제 서울 연평균 기온 (1973~2024)
// 소스: /public/data/seoul-annual-temp.json (archive-api.open-meteo.com)
const SEOUL_TEMPS_RAW = [{"year":1973,"avg":11.4},{"year":1974,"avg":10.5},{"year":1975,"avg":11.7},{"year":1976,"avg":10.6},{"year":1977,"avg":11.4},{"year":1978,"avg":11.8},{"year":1979,"avg":11.3},{"year":1980,"avg":10.3},{"year":1981,"avg":10},{"year":1982,"avg":11.2},{"year":1983,"avg":11.5},{"year":1984,"avg":10.9},{"year":1985,"avg":10.7},{"year":1986,"avg":10.9},{"year":1987,"avg":11.7},{"year":1988,"avg":11.1},{"year":1989,"avg":11.7},{"year":1990,"avg":12.2},{"year":1991,"avg":11.3},{"year":1992,"avg":11.1},{"year":1993,"avg":10.8},{"year":1994,"avg":12.5},{"year":1995,"avg":11.6},{"year":1996,"avg":10.7},{"year":1997,"avg":11.7},{"year":1998,"avg":12},{"year":1999,"avg":11.8},{"year":2000,"avg":11.7},{"year":2001,"avg":11.7},{"year":2002,"avg":12.2},{"year":2003,"avg":11.7},{"year":2004,"avg":12.3},{"year":2005,"avg":11.7},{"year":2006,"avg":12.5},{"year":2007,"avg":12.5},{"year":2008,"avg":11.8},{"year":2009,"avg":11.9},{"year":2010,"avg":11.2},{"year":2011,"avg":11.2},{"year":2012,"avg":11.5},{"year":2013,"avg":12.1},{"year":2014,"avg":12.5},{"year":2015,"avg":12.9},{"year":2016,"avg":12.7},{"year":2017,"avg":12.2},{"year":2018,"avg":12.5},{"year":2019,"avg":12.8},{"year":2020,"avg":11.6},{"year":2021,"avg":12},{"year":2022,"avg":11.4},{"year":2023,"avg":12.2},{"year":2024,"avg":12.9}];

const SEOUL_TEMPS = SEOUL_TEMPS_RAW.map(d => [d.year, d.avg] as [number, number]);

export default function Ch6WeatherVsClimate() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = svgRef.current.clientWidth || 520;
    const H = 240;
    svgRef.current.setAttribute("height", String(H));
    const m = { top: 16, right: 20, bottom: 32, left: 40 };

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    const xScale = d3.scaleLinear().domain([1973, 2025]).range([0, iW]);
    const yScale = d3.scaleLinear().domain([10, 15]).range([iH, 0]);

    // 그리드
    g.append("g").selectAll("line").data(yScale.ticks(4)).join("line")
      .attr("x1", 0).attr("x2", iW)
      .attr("y1", (d) => yScale(d)).attr("y2", (d) => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.08)").attr("stroke-dasharray", "3,3");

    // 연평균 기온 막대
    g.selectAll("rect").data(SEOUL_TEMPS).join("rect")
      .attr("x", ([year]) => xScale(year) - iW / SEOUL_TEMPS.length / 2.2)
      .attr("width", iW / SEOUL_TEMPS.length * 0.75)
      .attr("y", ([, temp]) => yScale(temp))
      .attr("height", ([, temp]) => iH - yScale(temp))
      .attr("fill", ([, temp]) => d3.interpolateRdYlBu(1 - (temp - 10) / 5))
      .attr("rx", 2);

    // 추세선
    if (showTrend) {
      const linReg = d3.rollup(
        SEOUL_TEMPS,
        (v) => d3.mean(v, (d) => d[1])!,
        (d) => d[0]
      );
      const n = SEOUL_TEMPS.length;
      const sumX = d3.sum(SEOUL_TEMPS, (d) => d[0]);
      const sumY = d3.sum(SEOUL_TEMPS, (d) => d[1]);
      const sumXY = d3.sum(SEOUL_TEMPS, (d) => d[0] * d[1]);
      const sumX2 = d3.sum(SEOUL_TEMPS, (d) => d[0] * d[0]);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const trendData: [number, number][] = [[1973, 1973 * slope + intercept], [2025, 2025 * slope + intercept]];
      const trendLine = d3.line<[number, number]>().x(([x]) => xScale(x)).y(([, y]) => yScale(y));

      g.append("path")
        .datum(trendData)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "6,3")
        .attr("d", trendLine);

      g.append("text")
        .attr("x", iW - 4)
        .attr("y", yScale(trendData[1][1]) - 6)
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .attr("font-size", "10")
        .text(`+${((slope) * 52).toFixed(1)}°C / 52년`);
    }

    // 축
    g.append("g").attr("transform", `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => String(d)).ticks(6))
      .call((ax) => ax.selectAll("text").attr("fill", "rgba(255,255,255,0.5)").style("font-size", "10px"))
      .call((ax) => ax.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}°`))
      .call((ax) => ax.selectAll("text").attr("fill", "rgba(255,255,255,0.5)").style("font-size", "10px"))
      .call((ax) => ax.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));
  }, [showTrend]);

  return (
    <section id="ch6" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-10">
        <span className="badge">6막</span>
        <h2 className="text-3xl md:text-4xl font-black" style={{ color: "var(--ink)" }}>
          날씨 예측 vs 기후 예측 —{" "}
          <span style={{ color: "var(--blue)" }}>왜 다른가</span>
        </h2>
        <p className="text-base" style={{ color: "var(--ink-sub)" }}>
          카오스 때문에 날씨는 2주 이상 예측이 불가능합니다.
          그런데 "50년 뒤 지구는 더워진다"는 예측은 어떻게 가능할까요?
        </p>
      </div>

      {/* 주사위 비유 */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <p className="text-sm font-bold mb-3" style={{ color: "var(--hot)" }}>날씨 예측 — 불가능 (2주↑)</p>
          <p className="text-4xl font-black mb-2">🎲</p>
          <p className="text-sm" style={{ color: "var(--ink-sub)" }}>
            주사위가 <strong>다음에 몇이 나올지</strong>는 알 수 없습니다.
            대기의 카오스 본성이 막습니다.
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-bold mb-3" style={{ color: "var(--blue)" }}>기후 예측 — 가능</p>
          <p className="text-4xl font-black mb-2">📊</p>
          <p className="text-sm" style={{ color: "var(--ink-sub)" }}>
            주사위를 <strong>1,000번 던지면 평균 3.5</strong>임은 압니다.
            온실가스 농도 → 평균 기온 상승 경향은 계산 가능합니다.
          </p>
        </div>
      </div>

      {/* 서울 기온 50년 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-bold">서울 연평균 기온 1973~2025</p>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox" checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <span style={{ color: "var(--ink-sub)" }}>추세선 표시</span>
          </label>
        </div>

        <div className="viz-inset">
          <svg ref={svgRef} width="100%" />
        </div>

        <div className="flex gap-3 text-xs flex-wrap">
          {[["낮음 (11°↓)","#5e81ac"],["평균 (12~13°)","#ebcb8b"],["높음 (14°↑)","#bf616a"]].map(([l,c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c }} />
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{l}</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl text-sm" style={{ background: "var(--blue-light)", color: "var(--blue-dark)" }}>
          개별 연도는 들쭉날쭉합니다. 하지만 <strong>52년 추세선은 명확합니다.</strong>
          카오스는 날씨를 막지만, 기후의 경향성은 막지 못합니다.
        </div>
      </div>
    </section>
  );
}
