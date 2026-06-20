"use client";

import { useEffect, useState } from "react";

interface CityWeather {
  name: string;
  temp: number;
  humidity: number;
  precipType: string;
}

const ACCURACY = { day1: 92, day3: 78, day7: 62 };

export default function Opening() {
  const [animated, setAnimated] = useState(false);
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/api/kma/realtime")
      .then((r) => r.json())
      .then((json) => {
        setCities(json.data ?? []);
        setFetchedAt(json.fetchedAt);
      })
      .catch(() => {});
  }, []);

  const bars = [
    { label: "1일 예보", value: ACCURACY.day1, color: "var(--blue)" },
    { label: "3일 예보", value: ACCURACY.day3, color: "#3b82f6" },
    { label: "7일 예보", value: ACCURACY.day7, color: "#94a3b8" },
  ];

  const now = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <section id="opening" className="chapter max-w-3xl mx-auto w-full">
      <div className="space-y-3 mb-12">
        <span className="badge">오프닝</span>
        <h1 className="text-4xl md:text-5xl font-black leading-tight" style={{ color: "var(--ink)" }}>
          "기상청 또 틀렸다"
          <br />
          <span style={{ color: "var(--blue)" }}>사실일까요?</span>
        </h1>
        <p className="text-lg" style={{ color: "var(--ink-sub)" }}>
          예보 정확도 데이터를 직접 확인해보세요.
          기간이 길어질수록 무슨 일이 일어나는지.
        </p>
      </div>

      {/* 실시간 전국 기온 */}
      {cities.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>
              지금 이 순간 — 전국 실시간 기온
            </p>
            {now && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
                {now} 기준
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {cities.slice(0, 10).map((city) => (
              <div
                key={city.name}
                className="text-center p-2 rounded-xl"
                style={{ background: "var(--bg-gray)" }}
              >
                <p className="text-xs" style={{ color: "var(--ink-dim)" }}>{city.name}</p>
                <p
                  className="text-lg font-black"
                  style={{
                    color: city.temp >= 33 ? "var(--hot)"
                      : city.temp >= 28 ? "var(--warm)"
                      : city.temp >= 20 ? "var(--blue)"
                      : "var(--cool)",
                  }}
                >
                  {city.temp}°
                </p>
                <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
                  습도 {city.humidity}%
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--ink-faint)" }}>
            출처: 기상청 공공데이터포털 초단기실황 · 데이터 10분 캐시
          </p>
        </div>
      )}

      {/* 예보 정확도 바 차트 */}
      <div className="card space-y-5 mb-5">
        <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>
          기상청 기온 예보 정확도 (최근 30일 평균)
        </p>
        {bars.map(({ label, value, color }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span>{label}</span>
              <span style={{ color }}>{value}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: animated ? `${value}%` : "0%", background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--blue-light)", border: "1px solid #bfdbfe" }}
      >
        <p className="text-base font-bold" style={{ color: "var(--blue-dark)" }}>
          1일 예보 92%, 7일 예보 62%.
        </p>
        <p className="text-sm mt-1" style={{ color: "#3b82f6" }}>
          기상청이 점점 부정확해지는 게 아닙니다 — 대기가 그렇게 생겼습니다. 스크롤해서 이유를 알아보세요.
        </p>
      </div>

      <div className="mt-10 flex items-center gap-2" style={{ color: "var(--ink-dim)" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M10 16l-4-4M10 16l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-sm">스크롤해서 이유를 알아보세요</span>
      </div>
    </section>
  );
}
