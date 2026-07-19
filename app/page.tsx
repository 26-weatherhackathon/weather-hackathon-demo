"use client";

import { useState } from "react";
import TerrainView from "./components/TerrainView";

const RAINFALL_MM = 90; // "비가 많이 와요" 상황에 해당하는 내부 강우량(mm)

export default function Home() {
  const [showTerrain, setShowTerrain] = useState(true);
  const [showFlow, setShowFlow] = useState(false);
  const [showRain, setShowRain] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold">우리 마을 홍수 방재 게임</h1>
        <p className="mt-2 text-sm text-neutral-600">
          버튼을 눌러 우리 마을 지형을 살펴보세요. 물은 높은 곳에서 낮은 곳으로 흘러요.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        <ToggleButton label="지형도 보기" active={showTerrain} onClick={() => setShowTerrain((v) => !v)} />
        <ToggleButton label="물 흐름 보기" active={showFlow} onClick={() => setShowFlow((v) => !v)} />
        <ToggleButton label="비가 오면?" active={showRain} onClick={() => setShowRain((v) => !v)} />
      </div>

      <TerrainView
        showTerrain={showTerrain}
        showFlow={showFlow}
        showRain={showRain}
        rainfallMm={RAINFALL_MM}
      />

      <p className="max-w-md text-center text-xs text-neutral-500">
        갈색·연두는 높은 곳, 초록·파랑은 낮은 곳이에요. 낮은 곳(파랑)이 먼저 물에 잠겨요.
      </p>
    </main>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-5 py-3 text-base font-semibold shadow transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-neutral-800 ring-1 ring-neutral-300 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
